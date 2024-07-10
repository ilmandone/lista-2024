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
import { FocusInputService } from '../../shared/focus-input.service'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'

import { cloneDeep } from 'lodash'
import { ListsConfirmDialogComponent } from './lists.confirm.dialog/lists.confirm.dialog.component'

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, ListsEmptyComponent, MatDialogModule, ListsItemComponent,
    LoaderComponent, ConfirmCancelComponent],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss'
})
export class ListsComponent implements OnInit {
  listsData = signal<Nullable<ListsData>>(null)
  itemsChanges: IListsItemChanges[] = []
  editModeOn = false
  disabled = false
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _dialog = inject(MatDialog)
  private readonly _focusSrv = inject(FocusInputService)
  private _listDataCache!: Nullable<ListsData>

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.id() !== null
    })
  }

  ngOnInit(): void {
    this._firebaseSrv.startDB()

    this._firebaseSrv.loadLists().then((r) => {
      this.listsData.set(r)
    })
  }

  //#region Privates

  /**
   * Update the list in f/e data
   * @param {string} label
   * @param {ListsData} data
   * @return New lists data and changes
   * @private
   */
  private _addInListData(label:string, data: ListsData): {
    newListsData: ListsData,
    changes: IListsItemChanges[]
  } {
    const newListsData = cloneDeep(data)
    const b = {
      UUID: self.crypto.randomUUID(),
      label,
      position: this.listsData()?.length || 1
    }

    newListsData.push({
      ...b,
      items: null,
      updated: this._firebaseSrv.gewNewTimeStamp()
    })

    const change: IListsItemChanges = {
      ...b,
      crud: 'create',
    }

    return {newListsData, changes: [change]}
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
   * Open dialog for new list
   * @description On confirm true add the new list in f/e data and update itemsChanges
   */
  openCreateNew() {
    const dr = this._dialog.open(NewListsDialogComponent)

    dr.afterClosed().subscribe((result) => {
      if (result) {
       this.itemNew(result)
      }
    })
  }

  //#endregion

  //#region Editing

  /**
   * Update listsData and add a change
   * @param {IListsItemChanges} $event
   */
  itemChanged($event: IListsItemChanges) {
    const {changes, newListsData} = this._updateInListData($event, this.listsData() as ListsData)
    this.listsData.set(newListsData)
    this.itemsChanges = this.itemsChanges.concat(changes)
  }

  /**
   * Delete a list in listsData and add a change
   * @param {IListsItemChanges} $event
   */
  itemDeleted($event: IListsItemChanges) {
    const {changes, newListsData} = this._deleteInListData($event, this.listsData() as ListsData)
    this.listsData.set(newListsData)
    this.itemsChanges = this.itemsChanges.concat(changes)
  }

  /**
   * Add a list in listsData and add a change
   * @param {string} label
   */
  itemNew(label: string) {
    const {changes, newListsData} = this._addInListData(label, this.listsData() as ListsData)
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
        // if (result) this._saveLists()
        this.editModeOn = false
      })

    } else {
      // this._saveLists()
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
