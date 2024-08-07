import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'
import { MatIcon } from '@angular/material/icon'
import { MatIconButton } from '@angular/material/button'
import { ItemData, ItemsChanges, ItemsData } from '../../data/firebase.interfaces'
import { LoaderComponent } from '../../components/loader/loader.component'
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet'
import {
  IListBottomSheetData,
  ListBottomSheetComponent
} from './list.bottom-sheet/list.bottom-sheet.component'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { ListItemComponent } from './list.item/list.item.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { ListNewDialogComponent } from './list.new.dialog/list.new.dialog.component'
import { ListItemSelectedEvent } from './list.item/list.item.interface'
import { cloneDeep } from 'lodash'
import { v4 as uuidV4 } from 'uuid'
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { MainStateService } from '../../shared/main-state.service'
import {
  DeleteConfirmDialogComponent
} from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    MatIcon,
    MatIconButton,
    LoaderComponent,
    MatBottomSheetModule,
    ButtonToggleComponent,
    ConfirmCancelComponent,
    ListItemComponent,
    MatDialogModule,
    CdkDrag,
    CdkDropList,
    CdkDragPlaceholder
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
class ListComponent implements OnInit {
  itemsData = signal<ItemData[]>([])
  editing = false
  label!: string
  selectedItems = new Set<string>()
  shopping = false
  viewModeGrid = false
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _bottomSheet = inject(MatBottomSheet)
  private readonly _dialog = inject(MatDialog)
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _mainStateSrv = inject(MainStateService)
  private _UUID!: string
  private _itemsDataCache: ItemData[] = []
  private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()

  async ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.params['label']

    this._firebaseSrv.loadList(this._UUID).then((r) => {
      this.itemsData.set(r)
    })
  }

  //#region Editing

  /**
   * Update items
   * @description Save items in db and reset all the edit information
   */
  _saveItems() {
    this._mainStateSrv.showLoader()
    this._firebaseSrv.updateList(this._itemsChanges.values, this._UUID).then((r) => {
      this.itemsData.set(r)

      this.selectedItems.clear()
      this._itemsChanges.clear()
      this._itemsDataCache = []

      this._mainStateSrv.hideLoader()
      this.editing = false
    })
  }

  /**
   * Delete button click
   */
  deleteItems() {
    const { itemsData, changes } = this._deleteInListItem([...this.selectedItems], this.itemsData())
    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
  }

  itemChanged($event: ItemsChanges) {
    const { itemsData, changes } = this._updateItem($event, this.itemsData())
    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
  }

  listsDrop($event: CdkDragDrop<ItemsData>) {
    const ld = this.itemsData()
    const cI = $event.currentIndex
    const pI = $event.previousIndex

    // Update the list order
    if (ld) {
      moveItemInArray(ld, pI, cI)
    }

    // Start depends on sort order and could be the original or the new position
    const start = cI < pI ? cI : pI

    // Register all the new position into the itemsChanges list
    for (let i = start; i < ld.length; i++) {
      const list = ld[i]
      list.position = i
      this._itemsChanges.set([
        {
          UUID: list.UUID,
          label: list.label,
          position: i,
          crud: 'update',
          group: list.group
        }
      ])
    }

    this.itemsData.set(ld)
  }

  /**
   * Open the new item dialog
   */
  openNewItemDialog() {
    const d = this._dialog.open(ListNewDialogComponent)

    d.afterClosed().subscribe((r) => {
      console.log(r)
      if (r) {
        const selectedUUID =
          this.selectedItems.size > 0 ? this.selectedItems.values().next().value : null

        const insertAfter = selectedUUID
          ? this.itemsData().find((e) => e.UUID === selectedUUID)?.position ??
          this.itemsData().length - 1
          : this.itemsData().length - 1

        const { itemsData, changes } = this._addInListItem(
          r,
          this.itemsData() as ItemData[],
          insertAfter
        )
        this.itemsData.set(itemsData)
        this._itemsChanges.set(changes)

        this.selectedItems.clear()
      }
    })
  }

  /**
   * Confirm shopping or editing mode
   */
  confirm() {
    if (this.shopping) {
      console.log('TODO: Remove the in cart value from all items and set toBuy to false')

      this.shopping = false
    } else {
      if (this._itemsChanges.hasDeletedItems) {
        const dr = this._dialog.open(DeleteConfirmDialogComponent)
        dr.afterClosed().subscribe((result) => {
          if (result) this._saveItems()
        })
      } else
        this._saveItems()
    }
  }

  /**
   * Cancel pressed in shopping or editing mode
   * @description Cancel shopping will remove all the in cart status from items. Cancel editing
   * will restore the cached data
   */
  cancel() {
    if (this.shopping) {
      this.shopping = false
    } else {
      this.itemsData.set(this._itemsDataCache)

      this.selectedItems.clear()
      this._itemsChanges.clear()
      this._itemsDataCache = []

      this.editing = false
    }
  }

  /**
   * Open the button sheet and subscribe to the dismiss event
   * @description If editing is enable save items to cache
   */
  openButtonSheet() {
    const p = this._bottomSheet.open(ListBottomSheetComponent, {
      data: {
        viewModeGrid: this.viewModeGrid
      } as IListBottomSheetData
    })

    p.afterDismissed().subscribe((r: IListBottomSheetData) => {
      Object.assign(this, { ...r })
      if (this.editing) this._itemsDataCache = cloneDeep(this.itemsData())
    })
  }

  //#endregion

  //#region Confirm / Cancel

  /**
   * Add or remove and item from the selectedItems set
   * @param {ListItemSelectedEvent} $event
   */
  itemSelected($event: ListItemSelectedEvent) {
    if ($event.isSelected) this.selectedItems.add($event.UUID)
    else this.selectedItems.delete($event.UUID)
  }

  /**
   * Add a new item to the itemData list and (add a change action for b/e update)
   * @param {string} label
   * @param {ItemData[]} data
   * @param insertAfter
   * @private
   */
  private _addInListItem(
    label: string,
    data: ItemsData,
    insertAfter: number
  ): {
    itemsData: ItemData[]
    changes: ItemsChanges[]
  } {
    const itemsData = cloneDeep(data)
    const newItem: ItemData = {
      UUID: uuidV4(),
      label,
      group: 'verdure',
      inCart: false,
      toBuy: true,
      position: insertAfter + 1
    }

    if (insertAfter === data.length - 1) itemsData.push(newItem)
    else {
      itemsData.splice(insertAfter + 1, 0, newItem)
    }

    return {
      itemsData,
      changes: [
        {
          UUID: newItem.UUID,
          label,
          position: newItem.position,
          group: newItem.group,
          crud: 'create'
        }
      ]
    }
  }

  //#endregion

  //#region Bottom menu

  /**
   * Delete one or more items
   * @param {string[]} UUIDs
   * @param {ItemsData} data
   * @private {itemsData: ItemsData}
   */
  private _deleteInListItem(
    UUIDs: string[],
    data: ItemsData
  ): {
    itemsData: ItemsData
    changes: ItemsChanges[]
  } {
    const itemsData = cloneDeep(data)
    const dPositions: number[] = []
    const changes: ItemsChanges[] = []

    UUIDs.forEach((UUID) => {
      const deleteIndex = itemsData.findIndex((i) => i.UUID === UUID)

      if (deleteIndex !== -1) {
        const d = itemsData[deleteIndex]
        dPositions.push(d.position)

        changes.push({
          UUID: d.UUID,
          label: d.label,
          group: d.group,
          position: d.position,
          crud: 'delete'
        })

        itemsData.splice(deleteIndex, 1)
      }
    })

    const sortedPosition = dPositions.sort()

    for (let i = sortedPosition[0]; i < itemsData.length; i++) {
      const item = itemsData[i]

      let j = sortedPosition.length - 1

      while (j >= 0) {
        const p = sortedPosition[j]
        if (item.position >= p) {
          item.position -= j + 1
          changes.push({
            UUID: item.UUID,
            label: item.label,
            group: item.group,
            position: item.position,
            crud: 'update'
          })
          break
        }
        j--
      }
    }

    return { itemsData, changes }
  }

  //#endregion

  //#region Item

  /**
   * Update one item
   * @description Return an update itemsData list and the changes for b/e
   * @param {ItemsChanges} change
   * @param {ItemsData} data
   * @return {{changes: ItemsChanges[], itemsData: ItemsData}} - An object containing the updated itemsData array and the change object.
   */
  private _updateItem(
    change: ItemsChanges,
    data: ItemsData
  ): {
    changes: ItemsChanges[]
    itemsData: ItemsData
  } {
    const itemsData = cloneDeep(data)
    const item = itemsData.find((i) => i.UUID === change.UUID)

    if (item) {
      item.label = change.label
    }

    return { itemsData, changes: [change] }
  }

  //#endregion
}

export default ListComponent
