import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet'
import { MatIconButton } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIcon } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { ItemComponent } from 'app/components/item/item.component'
import { ItemSelectedEvent } from 'app/components/item/item.interface'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { cloneDeep } from 'lodash'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import { ItemData, ItemsChanges, ItemsData } from '../../data/firebase.interfaces'
import { FirebaseService } from '../../data/firebase.service'
import {
  DeleteConfirmDialogComponent
} from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'
import { MainStateService } from '../../shared/main-state.service'
import {
  IListBottomSheetData,
  ListBottomSheetComponent
} from './list.bottom-sheet/list.bottom-sheet.component'
import { addItem, deleteItem, updateItemAttr, updateItemPosition } from './list.cud'
import { ListNewDialogComponent } from './list.new.dialog/list.new.dialog.component'

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
    ItemComponent,
    MatDialogModule,
    CdkDrag,
    CdkDropList,
    CdkDragPlaceholder
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
class ListComponent implements OnInit {

  private readonly AUTOSAVE_TIME_OUT = 1200

  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _bottomSheet = inject(MatBottomSheet)
  private readonly _dialog = inject(MatDialog)
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _mainStateSrv = inject(MainStateService)
  private _UUID!: string
  private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()
  private _itemsDataCache: ItemData[] = []
  private _autoSaveTimeOutID!: number
  private _inCartItems = new Set<number>()

  editing = false
  itemsData = signal<ItemData[]>([])
  label!: string
  selectedItems = new Set<string>()
  shopping = false
  viewModeGrid = false

  constructor() {
    effect(
      () => {
        if (this._mainStateSrv.reload()) {
          this._loadItems()
        }
      },
      { allowSignalWrites: true }
    )
  }

  async ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.params['label']

    this._loadItems()
  }

  //#region Editing

  /**
   * Handle autosave for not to buy data update
   */
  _engageSaveItems() {
    if (this._autoSaveTimeOutID) clearTimeout(this._autoSaveTimeOutID)
    this._autoSaveTimeOutID = window.setTimeout(this._saveItems.bind(this), this.AUTOSAVE_TIME_OUT)
  }

  _loadItems() {
    this._mainStateSrv.showLoader()
    this._firebaseSrv.loadList(this._UUID).then((r) => {
      this.itemsData.set(r)
      this._mainStateSrv.hideLoader()
    })
  }

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
   * Add an item
   * @description If another item is selected the new one is added after it
   * @param {string} label
   */
  addItem(label: string) {
    const selectedUUID =
      this.selectedItems.size > 0 ? this.selectedItems.values().next().value : null
    const insertAfter = selectedUUID
      ? this.itemsData().find((e) => e.UUID === selectedUUID)?.position ??
      this.itemsData().length - 1
      : this.itemsData().length - 1

    const { itemsData, changes } = addItem(label, this.itemsData() as ItemsData, insertAfter)

    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)

    this.selectedItems.clear()
  }

  /**
   * Delete button click
   */
  itemsDeleted() {
    const { itemsData, changes } = deleteItem([...this.selectedItems], this.itemsData())
    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
  }

  /**
   * Item attribute changed
   * @param $event
   */
  itemChanged($event: ItemsChanges) {
    const { itemsData, changes } = updateItemAttr($event, this.itemsData())

    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
  }

  /**
   * On item drop update the order
   * @param $event
   */
  itemDrop($event: CdkDragDrop<ItemsData>) {
    const { itemsData, changes } = updateItemPosition($event, this.itemsData())

    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
  }

  /**
   * Add or remove and item from the selectedItems set
   * @param {ItemSelectedEvent} $event
   */
  itemSelected($event: ItemSelectedEvent) {
    if ($event.isSelected) this.selectedItems.add($event.UUID)
    else this.selectedItems.delete($event.UUID)
  }

  /**
   * Open the new item dialog
   * @description On confirm the item is added to f/e data
   */
  openNewItemDialog() {
    const d = this._dialog.open(ListNewDialogComponent)

    d.afterClosed().subscribe((r: string) => {
      if (r) {
        this.addItem(r)
      }
    })
  }

  //#endregion

  //#region Bottom sheet

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

  //#region Interaction

  /**
   * Reset in cart state for all in cart items
   * @description return changes with new items data
   * @param {ItemsData} data
   * @param {Set<number>} inCartItems
   * @private
   */
  private _resetInCart(data: ItemsData, inCartItems: Set<number>): {
    newItemsData: ItemsData,
    changes: ItemsChanges[]
  } {
    const newItemsData = cloneDeep(data)
    const changes: ItemsChanges[] = []

    inCartItems.forEach(index => {
      const d = newItemsData[index]
      if (d.inCart) {
        d.inCart = false
        changes.push({
          ...d,
          crud: 'update'
        })
      }
    })

    return { newItemsData, changes }
  }

  /**
   * Set items from inCart to notToBuy
   * @description return changes with new items data
   * @param {itemsData} data
   * @param {Set<number>} inCartItems
   * @private
   */
  private _fromInCartToNotToBuy(data: ItemsData, inCartItems: Set<number>): {
    newItemsData: ItemsData,
    changes: ItemsChanges[]
  } {
    const newItemsData = cloneDeep(data)
    const changes: ItemsChanges[] = []

    inCartItems.forEach(index => {
      const d = newItemsData[index]
      if (d.inCart) {
        d.notToBuy = true
        d.inCart = false
        changes.push({
          ...d,
          crud: 'update'
        })
      }
    })

    return { newItemsData, changes }
  }

  /**
   * Click on an item
   * @description Update the item with the $event data for notToBuy and inCart properties
   * @param {ItemsChanges} $event
   */
  itemClicked($event: ItemsChanges) {
    if (!this.editing) {

      if (this.shopping) {
        const index = this.itemsData().findIndex(i => i.UUID === $event.UUID)

        if ($event.inCart) {
          this._inCartItems.add(index)
        } else if (this._inCartItems.has(index)) {
          this._inCartItems.delete(index)
        }
      }

      this.itemChanged($event)
      this._engageSaveItems()
    }
  }

  //#endregion

  //#region Confirm / Cancel

  /**
   * Confirm shopping or editing mode
   */
  confirm() {
    if (this.shopping) {

      const {
        newItemsData,
        changes
      } = this._fromInCartToNotToBuy(this.itemsData(), this._inCartItems)
      this._inCartItems.clear()
      this._itemsChanges.set(changes)
      this.itemsData.set(newItemsData)

      this.shopping = false


      this._engageSaveItems()

    } else {

      if (this._itemsChanges.hasDeletedItems) {
        const dr = this._dialog.open(DeleteConfirmDialogComponent)
        dr.afterClosed().subscribe((result) => {
          if (result) this._saveItems()
        })
      } else this._saveItems()
    }
  }

  /**
   * Cancel pressed in shopping or editing mode
   * @description Cancel shopping will remove all the in cart status from items. Cancel editing
   * will restore the cached data
   */
  cancel() {
    if (this.shopping) {

      const { newItemsData, changes } = this._resetInCart(this.itemsData(), this._inCartItems)
      this._inCartItems.clear()
      this._itemsChanges.set(changes)
      this.itemsData.set(newItemsData)

      this.shopping = false
      this._engageSaveItems()

    } else {

      this.itemsData.set(this._itemsDataCache)
      this._itemsDataCache = []
      this.selectedItems.clear()
      this._itemsChanges.clear()

      this.editing = false
    }
  }

  //#endregion
}

export default ListComponent
