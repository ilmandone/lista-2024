import {
  Component,
  DestroyRef,
  effect,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked
} from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  GroupData,
  ItemDataWithGroup,
  ItemsChanges,
  ItemsData,
  ItemsDataWithGroupRecord
} from '../../data/firebase.interfaces'
import { NewListGroupsService } from './new-list.groups.service'
import { MainStateService } from '../../shared/main-state.service'
import { forkJoin } from 'rxjs'
import { NewListService } from './new-list.service'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { LoaderComponent } from '../../components/loader/loader.component'
import { Unsubscribe } from 'firebase/firestore'
import { SnackBarService } from '../../shared/snack-bar.service'
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { ItemComponent } from '../../components/item/item.component'
import { LongPressDirective } from '../../shared/directives/long-press.directive'
import { ISnackBar } from '../../components/snack-bar/snack-bar.interface'
import { SetOfItemsChanges } from '../../data/items.changes'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { MatIcon } from '@angular/material/icon'
import { checkMobile } from '../../shared/detect.mobile'
import { NewListCartService } from './new-list.cart.service'
import {
  GroupBottomSheetData,
  ListGroupsBottomSheetComponent
} from './list.groups.bottom-sheet/list.groups.bottom-sheet.component'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { MatIconButton } from '@angular/material/button'
import { MatTooltip } from '@angular/material/tooltip'
import { ItemSelectedEvent } from '../../components/item/item.interface'
import {
  DeleteConfirmDialogComponent
} from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'
import { MatDialog } from '@angular/material/dialog'
import { ListNewDialogComponent } from './list.new.dialog/list.new.dialog.component'
import { fadeInOut } from './new-list.animations'
import {
  ListFindBottomSheetComponent
} from './list.find.bottom-sheet/list.find.bottom-sheet.component'
import { Nullable } from '../../shared/common.interfaces'

@Component({
  selector: 'app-new-list',
  standalone: true,
  imports: [
    ButtonToggleComponent,
    LoaderComponent,
    CdkDrag,
    CdkDropList,
    CdkScrollable,
    ItemComponent,
    LongPressDirective,
    ConfirmCancelComponent,
    MatIcon,
    MatIconButton,
    MatTooltip,
    CdkDragPlaceholder
  ],
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss',
  animations: [
    // Fade In/Out
    fadeInOut
  ]
})
class NewListComponent implements OnInit, OnDestroy {

  private readonly SAVE_DEBOUNCE_TIME = 1200
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _dialog = inject(MatDialog)
  private readonly _groupsSrv = inject(NewListGroupsService)
  private readonly _cartSrv = inject(NewListCartService)
  private readonly _bottomSheet = inject(MatBottomSheet)
  private readonly _listSrv = inject(NewListService)
  private readonly _destroyRef = inject(DestroyRef)
  private readonly _snackbarSrv = inject(SnackBarService)

  readonly mainStateSrv = inject(MainStateService)

  private _UUID!: string
  private _autoSaveTimeOutID!: number
  private _escKeyDisabled = false
  private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()
  private _itemsRecordCache!: ItemsDataWithGroupRecord
  private _itemsOrderCache!: string[]
  private _listUpdateReg!: Unsubscribe

  isMobile = checkMobile()
  label!: string
  editing = false
  selectedItems = new Set<string>()
  shopping = false

  groups = signal<Record<string, GroupData>>({})
  itemsOrder = signal<string[]>([])
  itemsRecord = signal<ItemsDataWithGroupRecord>({})

  constructor() {
    effect(() => {
      this._updatedItemFromOthersUsers()
    }, {
      allowSignalWrites: true
    })
  }

  //#region Key pressed


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
          if (!this._escKeyDisabled) this.addNewItemsDialog()
          break
        case 'd':
          if (this.selectedItems.size > 0 && this.selectedItems.size !== this.itemsOrder()?.length) {
            this.itemsDelete()
          }
          break
        default:
          console.warn('Unknown shortcut key', k)
      }
    }
  }

  //#endregion

  //#region Privates

  private _clearChangesAndCache() {
    this._itemsRecordCache = {}
    this._itemsOrderCache = []
    this._cartSrv.clearUndo()
    this._itemsChanges.clear()
  }

  /**
   * Get groups and list items
   *
   * @description items data will also contain group data
   * @private
   */
  private _loadData() {
    this.mainStateSrv.showLoader()

    forkJoin({
      groups: this._groupsSrv.loadGroups(),
      items: this._listSrv.loadItems(this._UUID)
    }).subscribe(({ groups, items }) => {
      this.groups.set(groups)
      const { data, order } = this._listSrv.mapItemsDataToRecordWithOrder(items, groups)
      this.itemsOrder.set(order)
      this.itemsRecord.set(data)

      this._cartSrv.storeInCartItems(items)

      this.mainStateSrv.hideLoader()
    })
  }

  /**
   * Save items changes
   * @private
   */
  private _saveItemsChanges(changes: SetOfItemsChanges<ItemsChanges> = this._itemsChanges, fromEditing = false) {
    this.mainStateSrv.showLoader()

    this._listSrv.saveItems(changes, this._UUID).subscribe((r) => {

      const snackBarOptions: ISnackBar = {
        message: r ?? 'Lista Aggiornata',
        severity: r ? 'error' : 'info'
      }

      if (r)
        this._snackbarSrv.show(snackBarOptions)
      else {
        if (fromEditing) {
          this._snackbarSrv.show(snackBarOptions)
        } else {
          this.mainStateSrv.showTopLineAlert('info')
        }

        this._itemsChanges.clear()
      }

      this.mainStateSrv.hideLoader()
    })
  }

  /**
   * Waiting SAVE_DEBOUNCE_TIME and update the list items in db
   *
   * @description SAVE_DEBOUNCE_TIME
   * @private
   */
  private _askForListSave() {
    if (this._autoSaveTimeOutID) clearTimeout(this._autoSaveTimeOutID)
    this._autoSaveTimeOutID = window.setTimeout(this._saveItemsChanges.bind(this), this.SAVE_DEBOUNCE_TIME)
  }

  /**
   * Update item attribute
   * @private
   * @param data
   */
  private _updateItem(data: { changed: ItemsChanges, original: ItemDataWithGroup }) {

    const newRecords = this._listSrv.updateItemsData(this.itemsRecord(), [data.changed], this.groups())

    this.itemsRecord.set(newRecords)
    this._itemsChanges.set([data.changed])

    if (this.shopping)
      this._cartSrv.updateItemUndoAndInCart(data.changed, data.original)

    this._askForListSave()
  }

  /**
   * Finalize data for end shopping confirmation
   * @private
   */
  private _shoppingFinalItemsUpdate() {
    const { record, changes } = this._cartSrv.finalizeItemsForShoppingConfirm(this.itemsRecord())

    if (changes.length > 0) {
      this._itemsChanges.set(changes)
      this.itemsRecord.set(record)
    }
  }

  /**
   * Update data if another user makes change
   *
   * @description In shopping or editing mode only notify that a user makes changes.
   * @private
   */
  private _updatedItemFromOthersUsers() {
    const itemsUpdated = this._listSrv.itemsUpdated$$()
    const snackOptions: ISnackBar = {
      message: 'Lista aggiornata da un altro utente',
      severity: 'info',
      dismiss: true
    }

    if (itemsUpdated)

      if (this.editing)
        this._snackbarSrv.show({
          ...snackOptions,
          severity: 'warning'
        }, 12)
      else {
        itemsUpdated.forEach(iu => {
          this._itemsChanges.removeByUUID(iu.UUID)

          if (this.shopping) {
            this._cartSrv.updateItemUndoAndInCart(iu, this._listSrv.itemDataFromItemWithGroup(untracked(this.itemsRecord)[iu.UUID]))
          }

          this._itemsChanges.set([{
            ...iu,
            crud: 'update'
          }])
        })

        const newRecords = this._listSrv.updateItemsData(untracked(this.itemsRecord), itemsUpdated, untracked(this.groups))

        this.itemsRecord.set(newRecords)
        this._snackbarSrv.show(snackOptions, 6)
      }
  }

  //#endregion

  ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.data['label']

    this._loadData()

    this.mainStateSrv.reload$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this._loadData()
      })

    this._listUpdateReg = this._listSrv.registerItemsUpdate(this._UUID)
  }

  ngOnDestroy() {
    this._listUpdateReg()
  }

  addNewItemsDialog() {
    this._escKeyDisabled = true
    this._dialog
      .open(ListNewDialogComponent)
      .afterClosed()
      .subscribe(r => {
        const {
          changes,
          order,
          records
        } = this._listSrv.addItem(r.label, r.color, this.itemsRecord(), this.itemsOrder(), this.selectedItems, this.groups())

        this.itemsRecord.set(records)
        this.itemsOrder.set(order)
        this._itemsChanges.set(changes)

        this.selectedItems.clear()

        this._escKeyDisabled = false
      })
  }

  /**
   * Set the shopping state and disable / enable main interface
   * @param $event
   */
  setShoppingState($event: boolean) {
    if ($event) {
      this._clearChangesAndCache()
      this._itemsRecordCache = this.itemsRecord()
    } else {
      this.cancel()
    }

    this.shopping = $event
    this.mainStateSrv.disableInterface($event)
  }

  //#region Item

  /**
   * Click on an item
   * @param $event
   */
  itemClicked($event: { changed: ItemsChanges, original: ItemDataWithGroup }) {
    if (!this.editing) {
      this._updateItem($event)
    }
  }

  /**
   * Delete one or more items
   */
  itemsDelete() {
    const {
      changes,
      order,
      records
    } = this._listSrv.deleteItems(this.itemsRecord(), this.itemsOrder(), this.selectedItems)

    this.itemsOrder.set(order)
    this.itemsRecord.set(records)
    this._itemsChanges.set(changes)

    this.selectedItems.clear()
  }

  /**
   * Item drop complete
   * @param $event
   */
  itemDrop($event: CdkDragDrop<ItemsData>) {
    const {
      changes,
      order,
      records
    } = this._listSrv.updateItemPosition(
      this.itemsRecord(), this.itemsOrder(), $event.previousIndex, $event.currentIndex
    )

    this.itemsRecord.set(records)
    this.itemsOrder.set(order)
    this._itemsChanges.set(changes)
  }

  /**
   * Item long press
   * @description Start edit mode
   */
  itemLongPress() {
    this.editing = true
    this._itemsRecordCache = this.itemsRecord()
    this._itemsOrderCache = this.itemsOrder()
  }

  /**
   * Item group change with bottom sheet
   * @param $event
   */
  itemGroupChange($event: ItemsChanges) {
    this._bottomSheet
      .open(ListGroupsBottomSheetComponent, {
        data: {
          UUID: $event.group
        } as GroupBottomSheetData
      })
      .afterDismissed()
      .subscribe((data: GroupData) => {
        if (data) {
          const newRecords = this._listSrv.updateItemGroup(this.itemsRecord(), $event.UUID, data)

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { groupData, ...forChange } = newRecords[$event.UUID]

          this._itemsChanges.set([{
            ...forChange,
            crud: 'update'
          }])

          this.itemsRecord.set(newRecords)
        }
      })
  }

  /**
   * Item renamed
   * @param $event
   */
  itemRenamed($event: ItemsChanges) {
    const newItemsRecord = { ...this.itemsRecord() }
    newItemsRecord[$event.UUID] = {
      ...$event,
      groupData: newItemsRecord[$event.UUID].groupData
    }
    this.itemsRecord.set(newItemsRecord)
    this._itemsChanges.set([{
      ...$event,
      crud: 'update'
    }
    ])
  }

  /**
   * Add or remove a UUID from the selected set
   * @param $event
   */
  itemSelected($event: ItemSelectedEvent) {
    if ($event.isSelected) this.selectedItems.add($event.UUID)
    else this.selectedItems.delete($event.UUID)
  }

  //#endregion

  //#region Search items

  /**
   * Open a bottom sheet for item search by label
   */
  searchItemsBottomSheet() {
    this._bottomSheet.open(ListFindBottomSheetComponent, {
      data: {
        searchCbFN: (v: Nullable<string>) => {
          return v ? Object.values(this.itemsRecord()).filter(i => i.label.toLowerCase().includes(v.toLowerCase())) : []
        }
      }
    })
      .afterDismissed().subscribe(r => {
      document.getElementById(r)?.scrollIntoView({ behavior: 'smooth' });
    })
  }

  //#endregion

  //#region Confirm / Undo

  /**
   * Shopping confirmation
   * @private
   */
  private _shoppingConfirm() {
    this.shopping = false
    this._shoppingFinalItemsUpdate()
    this._saveItemsChanges()

    this._snackbarSrv.show({
      message: 'Spesa completata',
      severity: 'info',
      dismiss: true
    })
  }

  /**
   * Edit confirmation
   * @private
   */
  private _editConfirm() {
    this.editing = false

    if (this._itemsChanges.hasDeletedItems) {
      const dr = this._dialog.open(DeleteConfirmDialogComponent)

      dr.afterClosed().subscribe((result) => {
        if (result) this._saveItemsChanges(this._itemsChanges, true)
      })
    } else {
      this._saveItemsChanges(this._itemsChanges, true)
    }

    if (this.selectedItems.size > 0) this.selectedItems.clear()
  }

  confirm() {
    if (this.shopping) {
      this._shoppingConfirm()
    } else {
      this._editConfirm()
    }
  }

  cancel() {
    if (this.shopping) {
      this.shopping = false
      // Cancel shopping will restore f/e and db items data
      if (this._cartSrv.haveUndo) {
        this.itemsRecord.set(this._itemsRecordCache)
        this._saveItemsChanges(this._cartSrv.undos)
      }
    } else {
      this.editing = false

      this.itemsRecord.set(this._itemsRecordCache)
      this.itemsOrder.set(this._itemsOrderCache)
      if (this.selectedItems.size > 0) this.selectedItems.clear()
    }
  }

  //#endregion

}

export default NewListComponent
