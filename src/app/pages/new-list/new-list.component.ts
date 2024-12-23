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
import { GroupData, ItemsChanges, ItemsDataWithGroup } from '../../data/firebase.interfaces'
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
    LongPressDirective
  ],
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss'
})
class NewListComponent implements OnInit, OnDestroy {

  private readonly SAVE_DEBOUNCE_TIME = 1200
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _groupsSrv = inject(NewListGroupsService)
  private readonly _listSrv = inject(NewListService)
  private readonly _destroyRef = inject(DestroyRef)
  private readonly _snackbarSrv = inject(SnackBarService)


  readonly mainStateSrv = inject(MainStateService)

  private _UUID!: string
  private _autoSaveTimeOutID!: number
  private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()
  private _listUpdateReg!: Unsubscribe

  label!: string
  editing = false
  shopping = false

  groups = signal<Record<string, GroupData>>({})
  items = signal<ItemsDataWithGroup>([])

  constructor() {
    effect(() => {
      this._updatedItemFromOthersUsers()
    }, {
      allowSignalWrites: true
    })
  }

  //#region Privates

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
      this.items.set(this._listSrv.addGroupDataInItems(items, groups))

      this.mainStateSrv.hideLoader()
    })
  }

  /**
   * Reset the list changes and state
   * @private
   */
  private _reset() {
    this._itemsChanges.clear()
  }

  /**
   * Save items changes
   * @private
   */
  private _saveItemsChanges (fromEditing = false) {
    this.mainStateSrv.showLoader()

    this._listSrv.saveItems(this._itemsChanges, this._UUID).subscribe((r)=>{

      // Show snackbar for save errors or for save after editing
      if (r || !r && fromEditing) {
        this._snackbarSrv.show({
          message: r ?? 'Lista Aggiornata',
          severity: r ? 'error' : 'info'
        })
      } else {
        this.mainStateSrv.showTopLineAlert('info')
      }

      this._reset()
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
   * @param change
   * @private
   */
  private _updateItem(change: ItemsChanges) {
    const newItems = this._listSrv.updateItemsData(this.items(), [change], this.groups())

    this.items.set(newItems)
    this._itemsChanges.set([change])

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

      if (this.shopping || this.editing) this._snackbarSrv.show({
        ...snackOptions,
        severity: 'warning'
      }, 12)
      else {
        this.items.set(
          this._listSrv.updateItemsData(untracked(this.items), itemsUpdated, untracked(this.groups))
        )
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
    this.shopping = $event
    this.mainStateSrv.disableInterface($event)
  }

  longPressed() {
    console.log('LONG PRESSED')
  }

  itemClicked($event: ItemsChanges) {
    if (!this.editing) {
      this._updateItem($event)
    }
  }
}

export default NewListComponent
