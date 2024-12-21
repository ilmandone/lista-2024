import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { GroupData } from '../../data/firebase.interfaces'
import { NewListGroupsService } from './new-list.groups.service'

@Component({
  selector: 'app-new-list',
  standalone: true,
  imports: [],
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss'
})
class NewListComponent implements OnInit {

  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _listGroupSrv = inject(NewListGroupsService)

  private _UUID!: string

  label!: string

  groups = signal<Record<string, GroupData>>({})

  ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.data['label']

    this._listGroupSrv.loadGroups().subscribe(r => {
      this.groups.set(r);
    })
  }
}

export default NewListComponent
