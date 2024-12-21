import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { GroupData, ItemsData } from '../../data/firebase.interfaces'
import { NewListGroupsService } from './new-list.groups.service'
import { MainStateService } from '../../shared/main-state.service'
import { forkJoin } from 'rxjs'
import { NewListService } from './new-list.service'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'

@Component({
  selector: 'app-new-list',
  standalone: true,
  imports: [
    ButtonToggleComponent
  ],
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss'
})
class NewListComponent implements OnInit {

  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _groupsSrv = inject(NewListGroupsService)
  private readonly _listSrv = inject(NewListService)
  readonly mainStateSrv = inject(MainStateService)

  private _UUID!: string

  label!: string
  editing = false
  shopping = false

  groups = signal<Record<string, GroupData>>({})
  items = signal<ItemsData>([])

  ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.data['label']

    this.mainStateSrv.showLoader()

    forkJoin({
      groups: this._groupsSrv.loadGroups(),
      items: this._listSrv.loadItems(this._UUID)
    }).subscribe(({groups, items}) => {
      this.groups.set(groups)
      this.items.set(items)

      this.mainStateSrv.hideLoader()
    })
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
