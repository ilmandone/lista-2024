import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { GroupData } from '../../data/firebase.interfaces'

@Component({
  selector: 'app-new-list',
  standalone: true,
  imports: [],
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss'
})
class NewListComponent implements OnInit {

  private readonly _activatedRoute = inject(ActivatedRoute)

  private _UUID!: string

  label!: string

  groups = signal<Record<string, GroupData>>({})

  ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.data['label']

    this.groups.set(await this._loadGroups())
  }
}

export default NewListComponent
