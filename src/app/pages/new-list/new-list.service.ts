import { inject, Injectable, signal } from '@angular/core'
import { from, Observable } from 'rxjs'
import { GroupData, ItemsData, ItemsDataWithGroup } from '../../data/firebase.interfaces'
import { FirebaseService } from '../../data/firebase.service'
import { Unsubscribe } from 'firebase/firestore'
import { Nullable } from '../../shared/common.interfaces'

@Injectable()
export class NewListService {

  private readonly _firebaseSrv = inject(FirebaseService)

  itemsUpdated$$ = signal<Nullable<ItemsData>>(null)

  /**
   * Inject group data into list's items
   * @param items
   * @param groups
   */
  addGroupDataInItems(items: ItemsData, groups: Record<string,  GroupData>): ItemsDataWithGroup {
    const r: ItemsDataWithGroup = []
    items.forEach((item,index) => {
      r[index] = {...item, groupData: groups[item.group] }
    })

    return r
  }

  /**
   * Load list's items
   * @param UUID
   */
  loadItems (UUID: string): Observable<ItemsData> {
    return from(this._firebaseSrv.loadList(UUID))
  }

  /**
   * Register for items change from db
   * @description items updated only for significant data
   * @param UUID
   */
  registerItemsUpdate(UUID: string): Unsubscribe {
    return this._firebaseSrv.registerUpdates(UUID, (r: ItemsData) => {
      if (r && r.length > 0)
        this.itemsUpdated$$.set(r)
    })
  }
}
