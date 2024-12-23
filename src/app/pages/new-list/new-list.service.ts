import { inject, Injectable, signal } from '@angular/core'
import { catchError, from, Observable, of } from 'rxjs'
import {
  GroupData,
  ItemDataWithGroup, ItemsChanges,
  ItemsData,
  ItemsDataWithGroup
} from '../../data/firebase.interfaces'
import { FirebaseService } from '../../data/firebase.service'
import { Unsubscribe } from 'firebase/firestore'
import { Nullable } from '../../shared/common.interfaces'
import { cloneDeep } from 'lodash'
import { SetOfItemsChanges } from '../../data/items.changes'

@Injectable()
export class NewListService {

  private readonly _firebaseSrv = inject(FirebaseService)

  itemsUpdated$$ = signal<Nullable<ItemsData>>(null)

  /**
   * Inject group data into list's items
   * @param items
   * @param groups
   */
  addGroupDataInItems(items: ItemsData, groups: Record<string, GroupData>): ItemsDataWithGroup {
    const r: ItemsDataWithGroup = []
    items.forEach((item, index) => {
      r[index] = { ...item, groupData: groups[item.group] }
    })

    return r
  }

  /**
   * Updates data items with a set of items
   *
   * @description Updates items groups data are also matched
   * @param originals
   * @param updates
   * @param groups
   */
  updateItemsData(originals: ItemsDataWithGroup, updates: ItemsData, groups: Record<string, GroupData>): ItemsDataWithGroup {

    const or = cloneDeep(originals)

    // Get list of updates UUID
    const updateUUIDs = new Set(updates.map(u => u.UUID))

    // Save original as Map of UUID with data and index
    const originalsMap = new Map<string,  {item: ItemDataWithGroup, index: number}>()
    or.forEach((o, index) => {
      if (updateUUIDs.has(o.UUID)) {
        originalsMap.set(o.UUID,{item: o,  index})
      }
    })

    updates.forEach(updated => {
      const original = originalsMap.get(updated.UUID)

      if (original) {
        const { index, item } = original

        or[index] = {
          ...item,
          ...updated,
          groupData: updated.group !== item.group ?
            groups[updated.group] : item.groupData
        }
      }
    })

    return or
  }

  /**
   * Load list's items
   * @param UUID
   */
  loadItems(UUID: string): Observable<ItemsData> {
    return from(this._firebaseSrv.loadList(UUID))
  }

  saveItems(changes: SetOfItemsChanges<ItemsChanges>, UUID: string): Observable<void | string> {
    return from(this._firebaseSrv.updateList(changes.values, UUID)).pipe(
      catchError(() => of('Aggiornamento della lista fallito'))
    )
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
