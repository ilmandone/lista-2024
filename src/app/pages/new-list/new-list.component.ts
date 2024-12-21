import { Component, DestroyRef, effect, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { GroupData, ItemsData } from '../../data/firebase.interfaces'
import { NewListGroupsService } from './new-list.groups.service'
import { MainStateService } from '../../shared/main-state.service'
import { forkJoin } from 'rxjs'
import { NewListService } from './new-list.service'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { LoaderComponent } from '../../components/loader/loader.component'
import { Unsubscribe } from 'firebase/firestore'

@Component({
  selector: 'app-new-list',
  standalone: true,
  imports: [
    ButtonToggleComponent,
    LoaderComponent
  ],
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss'
})
class NewListComponent implements OnInit, OnDestroy {

  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _groupsSrv = inject(NewListGroupsService)
  private readonly _listSrv = inject(NewListService)
  private readonly _destroyRef = inject(DestroyRef)

  readonly mainStateSrv = inject(MainStateService)

  private _UUID!: string
  private _listUpdateReg!: Unsubscribe

  label!: string
  editing = false
  shopping = false

  groups = signal<Record<string, GroupData>>({})
  items = signal<ItemsData>([])

  constructor() {
    effect(() => {
      const itemsUpdated = this._listSrv.itemsUpdated$$();
      console.log(itemsUpdated)
    })
  }

  //#region Privates

  /**
   * Load groups and list's items
   * @private
   */
  private _loadData() {
    this.mainStateSrv.showLoader()

    forkJoin({
      groups: this._groupsSrv.loadGroups(),
      items: this._listSrv.loadItems(this._UUID)
    }).subscribe(({ groups, items }) => {
      this.groups.set(groups)
      this.items.set(items)

      this.mainStateSrv.hideLoader()
    })
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
}

export default NewListComponent
