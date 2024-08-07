import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ListData, ListsData, ListsItemChanges } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { Nullable } from 'app/shared/common.interfaces'
import { ListsEmptyComponent } from './lists.empty/lists.empty.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { ListsItemComponent } from './lists.item/lists.item.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import { FocusInputService } from '../../components/focus-input/focus-input.service'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop'
import { MainStateService } from '../../shared/main-state.service'
import { Router } from '@angular/router'
import { ListsNewDialogComponent } from './lists-new.dialog/lists-new.dialog.component'
import {
  DeleteConfirmDialogComponent
} from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'

import { cloneDeep } from 'lodash'
import { v4 as uuidV4 } from 'uuid'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { addInListData, deleteInListData, updateInListData } from './lists.cud'

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    ListsEmptyComponent,
    MatDialogModule,
    ListsItemComponent,
    LoaderComponent,
    ConfirmCancelComponent,
    CdkDrag,
    CdkDropList,
    CdkDragPlaceholder
  ],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss'
})
class ListsComponent implements OnInit {
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _dialog = inject(MatDialog)
  private readonly _focusSrv = inject(FocusInputService)
  private readonly _mainStateSrv = inject(MainStateService)
  private readonly _route = inject(Router)

  private _listDataCache!: Nullable<ListsData>
  private _itemsChanges = new SetOfItemsChanges<ListsItemChanges>()

  listsData = signal<Nullable<ListsData>>(null)

  disabled = false
  editing = false

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.id() !== null
    })

    effect(
      () => {
        if (this._mainStateSrv.reload()) {
          this._loadLists()
        }
      },
      { allowSignalWrites: true }
    )
  }

  ngOnInit(): void {
    this._loadLists()
  }

  //#region Privates

  /**
   * Load lists and show loading main element
   * @private
   */
  private _loadLists(): void {
    this._mainStateSrv.showLoader()
    this._firebaseSrv.loadLists().then((r) => {
      this.listsData.set(r)
      this._mainStateSrv.hideLoader()
    })
  }

  /**
   * Update lists on db and refresh the view
   * @private
   */
  private _saveLists(): void {
    this._mainStateSrv.showLoader()
    this._firebaseSrv.updateLists(this._itemsChanges.values).then((r) => {
      this.listsData.set(r)
      this._mainStateSrv.hideLoader()
      this.editing = false
    })
  }

  //#endregion

  //#region Main

  /**
   * Top button click
   * @description Start edit mode | Open the create new dialog
   */
  clickTopButton() {
    if (!this.editing) {
      this._listDataCache = cloneDeep(this.listsData())
      this.editing = true
    } else this.openCreateNew()
  }

  //#endregion

  //#region Interactions

  /**
   * Item click and jump to list page
   * @param $event
   */
  listClicked($event: ListData) {
    void this._route.navigate([`main`, 'list', $event.UUID], {
      state: {
        label: $event.label
      }
    })
  }

  /**
   * Open dialog for new list
   * @description On confirm add the new list in f/e data and update _itemsChanges
   */
  openCreateNew() {
    const dr = this._dialog.open(ListsNewDialogComponent)

    dr.afterClosed().subscribe((result) => {
      if (result) {
        const {
          changes,
          newListsData
        } = addInListData(result, this.listsData(), this._firebaseSrv.gewNewTimeStamp())
        this.listsData.set(newListsData)
        this._itemsChanges.set(changes)
      }
    })
  }

  //#endregion

  //#region Editing

  /**
   * Update or delete list in listsData and add changes
   * @param {ListsItemChanges} $event
   */
  itemChanged($event: ListsItemChanges) {
    const { changes, newListsData } =
      $event.crud === 'update'
        ? updateInListData($event, this.listsData() as ListsData)
        : deleteInListData($event, this.listsData() as ListsData)
    this.listsData.set(newListsData)
    this._itemsChanges.set(changes)
  }

  /**
   * Drag and drop completed
   * @description Update the data list order and save all the changes for the items position
   * @param {CdkDragDrop<ListsData>} $event
   */
  listsDrop($event: CdkDragDrop<ListsData>) {
    const ld = this.listsData() as ListsData
    const cI = $event.currentIndex
    const pI = $event.previousIndex

    // Update the list order
    if (ld) {
      moveItemInArray(ld, pI, cI)
    }

    // Start depends on sort order and could be the original or the new position
    const start = cI < pI ? cI : pI

    // Register all the new position into the _itemsChanges list
    for (let i = start; i < ld.length; i++) {
      const list = ld[i]
      list.position = i
      this._itemsChanges.set([
        {
          UUID: list.UUID,
          label: list.label,
          position: i,
          crud: 'update'
        }
      ])
    }

    this.listsData.set(ld)
  }

  /**
   * Confirm editing
   */
  onConfirm() {
    if (this._itemsChanges.hasDeletedItems) {
      const dr = this._dialog.open(DeleteConfirmDialogComponent)
      dr.afterClosed().subscribe((result) => {
        if (result) this._saveLists()
      })
    } else {
      this._saveLists()
    }
  }

  /**
   * Undo editing
   * @description Restore data from cache and reset changes list
   */
  onCancel() {
    this.listsData.set(this._listDataCache)
    this._itemsChanges.clear()
    this.editing = false
  }

  //#endregion
}

export default ListsComponent
