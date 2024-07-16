import { Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _router = inject(Router)

  private _UUID!: string

  label!: string

  async ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']

    const l = await this._firebaseSrv.getListLabelByUUID(this._UUID)

    if (!l) void this._router.navigate(['/main'])
    else this.label = l
  }
}
