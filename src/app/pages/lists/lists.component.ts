import { Component, OnInit, inject, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ListsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { Nullable } from 'app/shared/common.interfaces'
import { EmptyListsComponent } from './empty-lists/empty-lists.component'

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, EmptyListsComponent],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss'
})
export class ListsComponent implements OnInit {
  private _firebaseSrv = inject(FirebaseService)

  public listsData = signal<Nullable<ListsData>>(null)

  ngOnInit(): void {
    this._firebaseSrv.startDB()

    this._firebaseSrv.loadLists().then((r) => {
      console.log('🚀 @@@ ~ file: lists.component.ts:24 ~ ListsComponent ~ this._firebaseSrv.loadLists ~ r:', r)
      this.listsData.set(r)
    })
  }
}
