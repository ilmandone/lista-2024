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
import { GroupData, ItemsDataWithGroup } from '../../data/firebase.interfaces'
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

  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _groupsSrv = inject(NewListGroupsService)
  private readonly _listSrv = inject(NewListService)
  private readonly _destroyRef = inject(DestroyRef)
  private readonly _snackbarSrv = inject(SnackBarService)

  readonly mainStateSrv = inject(MainStateService)

  private _UUID!: string
  private _listUpdateReg!: Unsubscribe

  label!: string
  editing = false
  shopping = false

  groups = signal<Record<string, GroupData>>({})
  items = signal<ItemsDataWithGroup>([])

  constructor() {
    effect(() => {
      this._updateItemsFromOthersUsers()
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
   * Update data if another user makes change
   *
   * @description In shopping or editing mode only notify that a user makes changes.
   * @private
   */
  private _updateItemsFromOthersUsers() {
    const itemsUpdated = this._listSrv.itemsUpdated$$()

    if (itemsUpdated)
      if (this.shopping || this.editing) this._snackbarSrv.show({
        message: 'Lista aggiornata da un altro utente',
        severity: 'warning',
        dismiss: true
      }, 120000)
      else this.items.set(
        this._listSrv.updateItemsData(untracked(this.items), itemsUpdated, untracked(this.groups))
      )
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
}

export default NewListComponent
