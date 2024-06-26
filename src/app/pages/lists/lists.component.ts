import { Component, OnInit, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { FirebaseService } from 'app/data/firebase.service'

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss'
})
export class ListsComponent implements OnInit {
  private _firebaseSrv = inject(FirebaseService)
  ngOnInit(): void {
    this._firebaseSrv.startDB()

    this._firebaseSrv.loadLists().then((r) => {
      console.log('🚀 @@@ ~ file: lists.component.ts:20 ~ ListsComponent ~ this._firebaseSrv.loadLists ~ r:', r)
    })
  }
}
