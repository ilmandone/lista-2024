import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'
import { MatIcon } from '@angular/material/icon'
import { MatIconButton } from '@angular/material/button'
import { ItemData } from '../../data/firebase.interfaces'
import { Nullable } from '../../shared/common.interfaces'
import { LoaderComponent } from '../../components/loader/loader.component'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    MatIcon,
    MatIconButton,
    LoaderComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _router = inject(Router)

  private _UUID!: string

  itemsData = signal<Nullable<ItemData[]>>([])
  editModeOn = false

  label!: string

  async ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']

    const l = await this._firebaseSrv.getListLabelByUUID(this._UUID)

    if (!l) void this._router.navigate(['/main'])
    else this.label = l

    this._firebaseSrv.loadList(this._UUID).then(r => {
      this.itemsData.set(r)
    })
  }
}
