import {
  Component,
  DestroyRef,
  effect,
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
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { ItemComponent } from '../../components/item/item.component'
import { LongPressDirective } from '../../shared/directives/long-press.directive'
import { ISnackBar } from '../../components/snack-bar/snack-bar.interface'
import { SetOfItemsChanges } from '../../data/items.changes'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { MatIcon } from '@angular/material/icon'
import { checkMobile } from '../../shared/detect.mobile'
import { NewListCartService } from './new-list.cart.service'
import { cloneDeep } from 'lodash'

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
    MatIcon
  ],
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss'
})
class NewListComponent implements OnInit, OnDestroy {

  private readonly SAVE_DEBOUNCE_TIME = 1200
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _groupsSrv = inject(NewListGroupsService)
  private readonly _cartSrv = inject(NewListCartService)
  private readonly _listSrv = inject(NewListService)
  private readonly _destroyRef = inject(DestroyRef)
  private readonly _snackbarSrv = inject(SnackBarService)


  readonly mainStateSrv = inject(MainStateService)

  private _UUID!: string
  private _autoSaveTimeOutID!: number
  private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()
  private _itemsRecordCache!: ItemsDataWithGroupRecord
  // private _undoItemsChanges = new SetOfItemsChanges<ItemsChanges>()
  private _listUpdateReg!: Unsubscribe


  isMobile = checkMobile()
  label!: string
  editing = false
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

  //#region Privates

  private _clearChangesAndCache() {
    this._itemsRecordCache = {}
    this._cartSrv.clearAll()
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

    if (this.shopping) {

      if (data.changed.inCart) this._cartSrv.addInCart(data.changed.UUID)
      else this._cartSrv.removeFromCart(data.changed.UUID)

      this._cartSrv.setUndo([{
        ...data.original,
        crud: data.changed.crud
      }])
    }

    this._askForListSave()
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
            this._cartSrv.removeUndo(iu.UUID)

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { groupData, ...itemData } = untracked(this.itemsRecord)[iu.UUID]

            this._cartSrv.setUndo([{
              ...itemData,
              crud: 'update'
            }])

            if (iu.inCart) this._cartSrv.addInCart(iu.UUID)
            else this._cartSrv.removeFromCart(iu.UUID)
          }
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

  longPressed() {
    console.log('LONG PRESSED')
  }

  /**
   * Click on an item
   * @param $event
   */
  itemClicked($event: { changed: ItemsChanges, original: ItemDataWithGroup }) {
    if (!this.editing) {
      this._updateItem($event)
    }
  }

  //#region Confirm / Undo

  confirm() {
    if (this.shopping) {
      this.shopping = false
      this._shoppingFinalItemsUpdate()
    }

    if (this.editing) this.editing = false

    // NOTE: This will cover error from shopping save and changes from editing
    // if (this._itemsChanges.hasValues) this._saveItemsChanges()
    this._saveItemsChanges()
  }

  cancel() {
    if (this.shopping) {

      // Cancel shopping will restore f/e and db items data
      if (this._cartSrv.haveUndo) {
        this.itemsRecord.set(this._itemsRecordCache)
        this._saveItemsChanges(this._cartSrv.undos)
      }

      this.shopping = false
    }
  }

  //#endregion

  private _shoppingFinalItemsUpdate() {

    const newRecords = cloneDeep(this.itemsRecord())
    const finalizedChanges: ItemsChanges[] = []

    this._cartSrv.inCart.forEach(ic => {
      newRecords[ic].inCart = false
      newRecords[ic].notToBuy = true

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { groupData, ...itemData } = newRecords[ic]

      finalizedChanges.push({
        ...itemData,
        crud: 'update'
      })
    })

    if (finalizedChanges.length > 0) {
      this._itemsChanges.set(finalizedChanges)
      this.itemsRecord.set(newRecords)
    }
  }
}

export default NewListComponent
