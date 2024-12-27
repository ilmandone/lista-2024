import { inject, Injectable, signal } from '@angular/core'
import { catchError, from, Observable, of } from 'rxjs'
import {
  GroupData,
  GroupsRecord, ItemData, ItemDataWithGroup,
  ItemsChanges,
  ItemsData,
  ItemsDataWithGroup,
  ItemsDataWithGroupRecord
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
  addGroupDataInItems(items: ItemsData, groups: GroupsRecord): ItemsDataWithGroup {
    const r: ItemsDataWithGroup = []
    items.forEach((item, index) => {
      r[index] = { ...item, groupData: groups[item.group] }
    })

    return r
  }

  /**
   * Return a Record of UUID, ItemsDataWithGroup and a list of UUID for order
   * @param items
   * @param groups
   */
  mapItemsDataToRecordWithOrder(items: ItemsData,  groups: GroupsRecord): {data: ItemsDataWithGroupRecord, order: string[]} {
    const data: ItemsDataWithGroupRecord = {}
    const order: string[] = []

    items.forEach((item) => {
      data[item.UUID] = { ...item, groupData: groups[item.group] }
      order.push(item.UUID)
    })

    return {data, order}
 }

 itemWithGroupToItemData(item: ItemDataWithGroup): ItemData {
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {groupData, ...itemData} = item
    return itemData
 }


  /**
   * Updates data items with a set of items
   *
   * @description Updates items groups data are also matched
   * @param r
   * @param updates
   * @param groups
   */
  updateItemsData(r: ItemsDataWithGroupRecord, updates: ItemsData, groups: Record<string, GroupData>): ItemsDataWithGroupRecord {
    const record = cloneDeep(r)

    updates.forEach(u => {
      const originalRecord = cloneDeep(record[u.UUID])

      record[u.UUID] = {
        ...originalRecord,
        ...u,
        groupData: u.group !== originalRecord.group ?
          groups[u.group] : originalRecord.groupData
      }
    })

    return record
  }

  /**
   * Update an item group and group data
   * @param r
   * @param UUID
   * @param gd
   */
  updateItemGroup(r: ItemsDataWithGroupRecord, UUID: string, gd: GroupData): ItemsDataWithGroupRecord {
    const record = cloneDeep(r)

    record[UUID].group = gd.UUID
    record[UUID].groupData = gd

    return record
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
