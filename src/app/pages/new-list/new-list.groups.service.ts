import { inject, Injectable } from '@angular/core'
import { FirebaseService } from '../../data/firebase.service'
import { GroupData } from '../../data/firebase.interfaces'
import { from, Observable, map } from 'rxjs'


@Injectable()
export class NewListGroupsService {

  private _firebaseSrv = inject(FirebaseService)

  /**
   * Return an observable of Record /
   * @param useCache
   */
  loadGroups(useCache = false): Observable<Record<string,  GroupData>> {
    return from(this._firebaseSrv.loadGroups(useCache)).pipe(
      map(r => r.reduce(
        (acc: Record<string, GroupData>, val) => {
          acc[val.UUID] = val
          return acc
        }, {}))
      )
  }
}
