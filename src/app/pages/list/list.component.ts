import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet'
import { MatIconButton } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { ActivatedRoute } from '@angular/router'
import { ItemComponent } from 'app/components/item/item.component'
import { ItemSelectedEvent } from 'app/components/item/item.interface'
import { DEFAULT_GROUP } from 'app/data/firebase.defaults'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { Nullable } from 'app/shared/common.interfaces'
import { checkMobile } from 'app/shared/detect.mobile'
import { cloneDeep } from 'lodash'
import { Subject, takeUntil } from 'rxjs'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import {
  GroupData,
  ItemsChanges,
  ItemsData,
  ItemsDataWithGroup
} from '../../data/firebase.interfaces'
import { FirebaseService } from '../../data/firebase.service'
import {
  DeleteConfirmDialogComponent
} from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'
import { MainStateService } from '../../shared/main-state.service'
import { addItem, deleteItem, updateItemAttr, updateItemPosition } from './list.cud'
import {
  GroupBottomSheetData,
  ListGroupsBottomSheetComponent
} from './list.groups.bottom-sheet/list.groups.bottom-sheet.component'
import { ListNewDialogComponent } from './list.new.dialog/list.new.dialog.component'
import { Unsubscribe } from 'firebase/firestore'
import { ScrollingModule } from '@angular/cdk/scrolling'
import { SnackBarService } from 'app/shared/snack-bar.service'
import {
  ShoppingCancelDialogComponent
} from '../../components/shopping.cancel.dialog/shopping.cancel.dialog.component'
import { LongPressDirective } from '../../shared/directives/long-press.directive'
import { MatMenuModule } from '@angular/material/menu'
import { sortFunctions, SortMode } from './list.sort-view'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    ButtonToggleComponent,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    ConfirmCancelComponent,
    ItemComponent,
    LoaderComponent,
    LongPressDirective,
    MatBottomSheetModule,
    MatDialogModule,
    MatIcon,
    MatIconButton,
    MatMenuModule,
    MatTooltip,
    ScrollingModule
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
class ListComponent implements OnInit, OnDestroy {
  private readonly AUTOSAVE_TIME_OUT = 1200

  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _bottomSheet = inject(MatBottomSheet)
  private readonly _dialog = inject(MatDialog)
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _snackBarSrv = inject(SnackBarService)

  private _UUID!: string
  private _autoSaveTimeOutID!: number
  private _escKeyDisabled = false
  private _inCartItemsIndex = new Set<number>()
  private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()
  private _itemsDataCache: ItemsDataWithGroup = []

  private _destroyed$ = new Subject<boolean>()
  private _itemUpdateUnsubscribe!: Unsubscribe

  readonly mainStateSrv = inject(MainStateService)

  editing = false
  groups = signal<Record<string, GroupData>>({})
  isMobile = checkMobile()
  itemsData = signal<Nullable<ItemsDataWithGroup>>(null)
  label!: string
  selectedItems = new Set<string>()
  shopping = false
  sortMode: SortMode = 'position'

  async ngOnInit() {

    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.data['label']
    this.groups.set(await this._loadGroups())

    await this._loadData(false)

    // Reload action
    this.mainStateSrv.reload$.pipe(takeUntil(this._destroyed$)).subscribe(async () => {
      await this._loadData()
    })

    // Registration to firebase snapshot for other's user update
    this._itemUpdateUnsubscribe = this._firebaseSrv.registerUpdates(this._UUID, (d: ItemsData) => {
      if (d.length > 0) {
        this.mainStateSrv.showLoader()
        const dataWithGroup = this._itemsWithGroupData(this.groups(), d).data
        const newData = this.itemsData() as ItemsDataWithGroup

        dataWithGroup.forEach((d) => {
          const index = newData?.findIndex((nd) => nd.UUID === d.UUID)
          if (index > -1) {
            newData[index] = d
          }
        })

        this.itemsData.set(newData)
        this.mainStateSrv.hideLoader()
      }
    })
  }

  ngOnDestroy(): void {
    this._itemUpdateUnsubscribe()
    this._destroyed$.next(true)
    this._destroyed$.complete()
  }

  /**
   * Shortcuts for editing on desktop
   * @param $event
   */
  @HostListener('window:keyup', ['$event']) onKeyPress($event: KeyboardEvent) {
    if (this.isMobile) return

    $event.preventDefault()
    const k = $event.key.toLowerCase()

    if (k === 'escape' && !this._escKeyDisabled && (this.shopping || this.editing)) {
      this.cancel()
      return
    }

    if (!$event.shiftKey || !$event.altKey) return

    if (k === 'enter' && this.shopping || this.editing) {
      this.confirm()
    }

    if (this.editing) {
      switch (k) {
        case 'a':
          if (!this._escKeyDisabled) this.openNewItemDialog()
          break
        case 'd':
          if (this.selectedItems.size > 0 && this.selectedItems.size !== this.itemsData()?.length) {
            this.itemsDeleted()
          }
          break
        default:
          console.warn('Unknown shortcut key', k)
      }
    }
  }

  /**
   * Loads the groups data from the Firebase service and returns a promise that resolves to a record
   * mapping group UUIDs to GroupData objects.
   *
   * @param {boolean} useCache - Whether to use the cache or load the groups data from the Firebase service.
   * @return {Promise<Record<string, GroupData>>} A promise that resolves to a record mapping group UUIDs to GroupData objects.
   */
  private async _loadGroups(useCache = false): Promise<Record<string, GroupData>> {
    const g = await this._firebaseSrv.loadGroups(useCache)
    return g.reduce((acc: Record<string, GroupData>, val) => {
      acc[val.UUID] = val
      return acc
    }, {})
  }

  /**
   * Load groups and items data
   * @description Items with missing group UUID are updated to default group value
   * @param {boolean} showLoader
   */
  async _loadData(showLoader = true) {
    if (showLoader) this.mainStateSrv.showLoader()
    this.groups.set(await this._loadGroups())

    this._firebaseSrv.loadList(this._UUID).then((items) => {
      const { data, itemsToDefault } = this._itemsWithGroupData(this.groups(), items)
      this.itemsData.set(data)

      // Fix missing items groups values
      if (itemsToDefault.length > 0) {
        this._itemsChanges.set(itemsToDefault)
        this._saveItems()
      }

      if (showLoader) this.mainStateSrv.hideLoader()
    })
  }

  //#region Editing

  /**
   * Handle autosave for not to buy data update
   */
  _engageSaveItems() {
    if (this._autoSaveTimeOutID) clearTimeout(this._autoSaveTimeOutID)
    this._autoSaveTimeOutID = window.setTimeout(this._saveItems.bind(this), this.AUTOSAVE_TIME_OUT)
  }

  /**
   * Creates an array of item data with group information.
   *
   * @param {GroupsData} groups - The collection of group data.
   * @param {ItemsData} items - The collection of item data.
   * @return {ItemDataWithGroup[]} An array of item data with group information.
   */
  private _itemsWithGroupData(
    groups: Record<string, GroupData>,
    items: ItemsData
  ): {
    data: ItemsDataWithGroup
    itemsToDefault: ItemsChanges[]
  } {
    const itemsToDefault: ItemsChanges[] = []

    const data = items.map((item) => {
      const groupData = groups[item.group]
      // Add group data to original item data
      if (groupData) {
        return { ...item, groupData }
      }
      // The item doesn't have a valid group UUID -> Set default value
      else {
        itemsToDefault.push({
          ...item,
          group: DEFAULT_GROUP.UUID,
          crud: 'update'
        })
        return { ...item, group: DEFAULT_GROUP.UUID, groupData: DEFAULT_GROUP }
      }
    })

    return { data, itemsToDefault }
  }

  /**
   * Reset selected items, items changes and cache after save editing
   * @private
   */
  private _resetEditing() {
    this.selectedItems.clear()
    this._itemsChanges.clear()
    this._itemsDataCache = []

    this.mainStateSrv.hideLoader()
    this.editing = false
  }

  private _resetShopping() {
    const { newItemsData, changes } = this._resetInCart(
      this.itemsData() as ItemsDataWithGroup,
      this._inCartItemsIndex
    )
    this._inCartItemsIndex.clear()
    this._itemsChanges.set(changes)
    this.itemsData.set(newItemsData)

    this.shoppingState(false)
  }

  /**
   * Update items
   * @description Save items in db and reset all the edit information
   */
  async _saveItems(asSnackbar = false) {
    this.mainStateSrv.showLoader()
    this.groups.set(await this._loadGroups(true))

    this._firebaseSrv.updateList(this._itemsChanges.values, this._UUID)
      .then(() => {
        this._resetEditing()

        if (asSnackbar)
          this._snackBarSrv.show({
            message: 'Lista aggiornata',
            severity: 'info'
          })
        else {
          this.mainStateSrv.showTopLineAlert('info')
        }
      })
      .catch(() => {
        this.itemsData.set(this._itemsDataCache)
        this._resetEditing()

        this._snackBarSrv.show({
          message: 'Aggiornamento fallito',
          severity: 'error'
        })
      })
  }

  /**
   * Add an item
   * @description If another item is selected the new one is added after it
   * @param {string} label
   * @param {string} groupUUID
   */
  addItem(label: string, groupUUID: string) {
    if (this.itemsData() === null) return

    const d = this.itemsData() as ItemsDataWithGroup
    const selectedUUID =
      this.selectedItems.size > 0 ? this.selectedItems.values().next().value : null

    const insertAfter = selectedUUID
      ? (d.find((e) => e.UUID === selectedUUID)?.position ?? d.length - 1)
      : d.length - 1

    const groupData = this.groups()[groupUUID]
    const { itemsData, changes } = addItem(label, groupData, d, insertAfter)

    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)

    this.selectedItems.clear()
  }

  /**
   * Delete button click
   */
  itemsDeleted() {
    if (this.itemsData() === null) return

    const { itemsData, changes } = deleteItem(
      [...this.selectedItems],
      this.itemsData() as ItemsDataWithGroup
    )
    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
    this.selectedItems.clear()
  }

  /**
   * Item attribute changed
   * @param $event
   */
  itemChanged($event: ItemsChanges) {
    const { itemsData, changes } = updateItemAttr($event, this.itemsData() as ItemsDataWithGroup)

    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
  }

  /**
   * On item drop update the order
   * @param $event
   */
  itemDrop($event: CdkDragDrop<ItemsData>) {
    const { itemsData, changes } = updateItemPosition(
      $event,
      this.itemsData() as ItemsDataWithGroup
    )
    this.itemsData.set(itemsData)
    this._itemsChanges.set(changes)
  }

  /**
   * Item group changed
   * @description Open bottom sheet to edit the item group
   * @param {ItemsChanges} $event
   */
  itemGroupChanged($event: ItemsChanges) {
    this._bottomSheet
      .open(ListGroupsBottomSheetComponent, {
        data: {
          UUID: $event.group
        } as GroupBottomSheetData
      })
      .afterDismissed()
      .subscribe((data: GroupData) => {
        if (data) {
          const { itemsData, changes } = updateItemAttr(
            $event,
            this.itemsData() as ItemsDataWithGroup,
            data
          )
          changes[0].group = data.UUID

          this.itemsData.set(itemsData)
          this._itemsChanges.set(changes)
        }
      })
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
   * Long press on a list item
   */
  longPressed() {
    this._itemsDataCache = cloneDeep(this.itemsData() as ItemsDataWithGroup)
    this.editing = true
  }

  /**
   * Open the new item dialog
   * @description On confirm the item is added to f/e data
   */
  openNewItemDialog() {
    this._escKeyDisabled = true
    this._dialog
      .open(ListNewDialogComponent)
      .afterClosed()
      .subscribe((r: { label: string; color: string }) => {
        if (r?.label) {
          this.addItem(r.label, r.color)
        }

        this._escKeyDisabled = false
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
  private _resetInCart(
    data: ItemsDataWithGroup,
    inCartItems: Set<number>
  ): {
    newItemsData: ItemsDataWithGroup
    changes: ItemsChanges[]
  } {
    const newItemsData = cloneDeep(data)
    const changes: ItemsChanges[] = []

    inCartItems.forEach((index) => {
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
  private _fromInCartToNotToBuy(
    data: ItemsDataWithGroup,
    inCartItems: Set<number>
  ): {
    newItemsData: ItemsDataWithGroup
    changes: ItemsChanges[]
  } {
    const newItemsData = cloneDeep(data)
    const changes: ItemsChanges[] = []

    inCartItems.forEach((index) => {
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
        const index = (this.itemsData() as ItemsDataWithGroup).findIndex(
          (i) => i.UUID === $event.UUID
        )

        if ($event.inCart) {
          this._inCartItemsIndex.add(index)
        } else if (this._inCartItemsIndex.has(index)) {
          this._inCartItemsIndex.delete(index)
        }
      } else if (!this.editing) {
        this._engageSaveItems()
      }

      this.itemChanged($event)
    }
  }

  sortItems(sortMode: SortMode) {
    console.log(sortMode)
    this.sortMode = sortMode
    const sortFn = sortFunctions[sortMode]
    this.itemsData.set(sortFn(this.itemsData() as ItemsDataWithGroup))
  }

  //#endregion


  //#region Confirm / Cancel

  /**
   * Confirm shopping or editing mode
   */
  confirm() {
    if (this.shopping) {
      const { newItemsData, changes } = this._fromInCartToNotToBuy(
        this.itemsData() as ItemsDataWithGroup,
        this._inCartItemsIndex
      )
      this._inCartItemsIndex.clear()
      this._itemsChanges.set(changes)
      this.itemsData.set(newItemsData)

      this.shoppingState(false)

      this._engageSaveItems()
    } else {
      if (this._itemsChanges.hasDeletedItems) {
        const dr = this._dialog.open(DeleteConfirmDialogComponent)
        dr.afterClosed().subscribe((result) => {
          if (result) void this._saveItems(true)
        })
      } else void this._saveItems(true)
    }
  }

  /**
   * Cancel pressed in shopping or editing mode
   * @description Cancel shopping will remove all the in cart status from items. Cancel editing
   * will restore the cached data
   */
  cancel() {
    if (this.shopping) {

      if (this._inCartItemsIndex.size > 0) {
        const dr = this._dialog.open(ShoppingCancelDialogComponent)
        dr.afterClosed().subscribe((result) => {
          if (result) this._resetShopping()
        })
      } else
        this._resetShopping()

    } else {
      this.itemsData.set(this._itemsDataCache)
      this._itemsDataCache = []
      this.selectedItems.clear()
      this._itemsChanges.clear()

      this.editing = false
    }
  }

  //#endregion

  shoppingState($event: boolean) {
    this.shopping = $event
    this.mainStateSrv.disableInterface($event)
  }
}

export default ListComponent
