import { inject, Injectable } from '@angular/core'
import { from, Observable } from 'rxjs'
import { ItemsData } from '../../data/firebase.interfaces'
import { FirebaseService } from '../../data/firebase.service'

@Injectable()
export class NewListService {

  private readonly firebaseSrv = inject(FirebaseService)

  loadItems (UUID: string): Observable<ItemsData> {
    return from(this.firebaseSrv.loadList(UUID))
  }

}
