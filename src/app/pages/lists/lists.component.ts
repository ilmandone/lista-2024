import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ListData, ListsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { Nullable } from 'app/shared/common.interfaces'
import { ListsEmptyComponent } from './lists.empty/lists.empty.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { NewListsDialogComponent } from './new-lists.dialog/new-lists.dialog.component'
import { IListsItemChanges, ListsItemComponent } from './lists.item/lists.item.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import { FocusInputService } from '../../components/focus-input/focus-input.service'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'

import { cloneDeep } from 'lodash'
import { ListsConfirmDialogComponent } from './lists.confirm.dialog/lists.confirm.dialog.component'
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop'
import { MainStateService } from '../../shared/main-state.service'

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, ListsEmptyComponent, MatDialogModule, ListsItemComponent,
    LoaderComponent, ConfirmCancelComponent, CdkDrag, CdkDropList, CdkDragPlaceholder,],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss'
})
export class ListsComponent implements OnInit {
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _dialog = inject(MatDialog)
  private readonly _focusSrv = inject(FocusInputService)
  private readonly _mainStateSrv = inject(MainStateService)

  private _listDataCache!: Nullable<ListsData>

  listsData = signal<Nullable<ListsData>>(null)

  disabled = false
  dragEnable = false
  editModeOn = false
  itemsChanges: IListsItemChanges[] = []

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.id() !== null
    })

    effect(() => {
      if (this._mainStateSrv.reload()) {
        this._loadLists()
      }
    }, {allowSignalWrites: true})
  }

  ngOnInit(): void {
    this._firebaseSrv.startDB()
    this._loadLists()
  }

  //#region Privates

  /**
   * Load lists and show loading main element
   * @private
   */
  private _loadLists(): void {
    this._mainStateSrv.showLoader.set(true)
    this._firebaseSrv.loadLists().then((r) => {
      this.listsData.set(r)
      this._mainStateSrv.showLoader.set(false)
    })
  }

  /**
   * Update lists on db and refresh the view
   * @private
   */
  private _saveLists(): void {
    this._mainStateSrv.showLoader.set(true)
    this._firebaseSrv.updateLists(this.itemsChanges).then(r => {
      this.listsData.set(r)
      this._mainStateSrv.showLoader.set(false)
    })
  }

  /**
   * Update the list in f/e data
   * @param {string} label
   * @param {ListsData} data
   * @return New lists data and changes
   * @private
   */
  private _addInListData(label: string, data: ListsData): {
    newListsData: ListsData,
    changes: IListsItemChanges[]
  } {
    const newListsData = cloneDeep(data)
    const newItem = {
      UUID: self.crypto.randomUUID(),
      label,
      position: (this.listsData()?.length ?? 0) + 1,
      items: null,
      updated: this._firebaseSrv.gewNewTimeStamp()
    }

    newListsData.push(newItem)

    return {
      newListsData,
      changes: [{ UUID: newItem.UUID, label, position: newItem.position, crud: 'create' }]
    }
  }

  /**
   * Update the list in f/e data
   * @param {IListsItemChanges} change
   * @param {ListsData} data
   * @return New lists data and changes
   * @private
   */
  private _updateInListData(change: IListsItemChanges, data: ListsData): {
    newListsData: ListsData,
    changes: IListsItemChanges[]
  } {
    const newListsData = cloneDeep(data)
    const item = newListsData.find(list => list.UUID === change.UUID)

    if (item) {
      item.label = change.label
      item.position = change.position
    }

    return { newListsData, changes: [change] }
  }

  /**
   * Delete the list from the f/e data
   * @param {IListsItemChanges} change
   * @param {ListsData} data
   * @return New lists data and changes
   * @private
   */
  private _deleteInListData(change: IListsItemChanges, data: ListsData): {
    newListsData: ListsData,
    changes: IListsItemChanges[]
  } {
    const newListsData = cloneDeep(data)
    const changes: IListsItemChanges[] = [change]
    const i = newListsData.findIndex(list => list.UUID === change.UUID)

    if (i !== -1) {
      newListsData.splice(i, 1)
    }

    // Update all the positions -> following position changes will use this information
    newListsData.forEach(list => {
      if (list.position > change.position) {
        list.position -= 1
        changes.push({
          UUID: list.UUID,
          label: list.label,
          position: list.position,
          crud: 'update'
        })
      }
    })

    return { newListsData, changes }
  }

  //#endregion

  //#region Main

  /**
   * Top button click
   * @description Start edit mode | Open the create new dialog
   */
  clickTopButton() {
    if (!this.editModeOn) {
      this._listDataCache = cloneDeep(this.listsData())
      this.editModeOn = true
    } else this.openCreateNew()
  }

  //#endregion

  //#region Interactions

  /**
   * Drag and drop completed
   * @description Update the data list order and save all the changes for the items position
   * @param {CdkDragDrop<ListData[]>} $event
   */
  listsDrop($event: CdkDragDrop<ListData[]>) {
    const ld = this.listsData() as ListsData
    const cI = $event.currentIndex

    // Update the list order
    if (ld) {
      moveItemInArray(ld, $event.previousIndex, cI)
    }

    // Update all position from start to current index
    for (let i = 0; i <= cI; i ++) {
      const list = ld[i]
      list.position = i + 1
      this.itemsChanges.push({
        UUID: list.UUID,
        label: list.label,
        position: list.position,
        crud: 'update',
      })
    }

    this.listsData.set(ld)
    this.dragEnable = false
  }

  /**
   * Open dialog for new list
   * @description On confirm true add the new list in f/e data and update itemsChanges
   */
  openCreateNew() {
    const dr = this._dialog.open(NewListsDialogComponent)

    dr.afterClosed().subscribe((result) => {
      if (result) {
        const { changes, newListsData } = this._addInListData(result, this.listsData() as ListsData)
        this.listsData.set(newListsData)
        this.itemsChanges = this.itemsChanges.concat(changes)
      }
    })
  }

  //#endregion

  //#region Editing

  /**
   * Update or delete list in listsData and add changes
   * @param {IListsItemChanges} $event
   */
  itemChanged($event: IListsItemChanges) {
    const { changes, newListsData } =
      $event.crud === 'update'
        ? this._updateInListData($event, this.listsData() as ListsData)
        : this._deleteInListData($event, this.listsData() as ListsData)
    this.listsData.set(newListsData)
    this.itemsChanges = this.itemsChanges.concat(changes)
  }

  /**
   * Confirm editing
   */
  onConfirm() {
    const hasDeleteActions = this.itemsChanges.some(item => item.crud === 'delete')

    if (hasDeleteActions) {
      const dr = this._dialog.open(ListsConfirmDialogComponent)
      dr.afterClosed().subscribe((result) => {
        if (result) this._saveLists()
        this.editModeOn = false
      })

    } else {
      this._saveLists()
      this.editModeOn = false
    }
  }

  /**
   * Undo editing
   * @description Restore data from cache and reset changes list
   */
  onCancel() {
    this.listsData.set(this._listDataCache)
    this.itemsChanges = []
    this.editModeOn = false
  }

  //#endregion
}
