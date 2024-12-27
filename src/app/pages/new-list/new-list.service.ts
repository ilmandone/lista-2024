import { inject, Injectable, signal } from '@angular/core'
import { catchError, from, Observable, of } from 'rxjs'
import {
  GroupData,
  GroupsRecord,
  ItemData,
  ItemDataWithGroup,
  ItemsChanges,
  ItemsData,
  ItemsDataWithGroupRecord
} from '../../data/firebase.interfaces'
import { FirebaseService } from '../../data/firebase.service'
import { Unsubscribe } from 'firebase/firestore'
import { Nullable } from '../../shared/common.interfaces'
import { cloneDeep } from 'lodash'
import { SetOfItemsChanges } from '../../data/items.changes'
import { moveItemInArray } from '@angular/cdk/drag-drop'

@Injectable()
export class NewListService {

  private readonly _firebaseSrv = inject(FirebaseService)

  itemsUpdated$$ = signal<Nullable<ItemsData>>(null)

  changeItemPosition(r: ItemsDataWithGroupRecord, o: string[], pI: number, cI: number): {records: ItemsDataWithGroupRecord, order: string[], changes: ItemsChanges[]} {
    const records = cloneDeep(r)
    const order = cloneDeep(o)
    const changes: ItemsChanges[] = []

    moveItemInArray(order, pI, cI)

    const start = cI < pI ? cI : pI

    for (let i = start; i < order.length; i ++) {
      const item = records[order[i]]
      item.position = i

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {groupData, ...change} = item
      changes.push({
        ...change,
        crud: 'update'
      })
    }

    return {records,  order, changes}
  }

  /**
   * Return a Record of UUID, ItemsDataWithGroup and a list of UUID for order
   * @param items
   * @param groups
   */
  mapItemsDataToRecordWithOrder(items: ItemsData, groups: GroupsRecord): {
    data: ItemsDataWithGroupRecord,
    order: string[]
  } {
    const data: ItemsDataWithGroupRecord = {}
    const order: string[] = []

    items.forEach((item) => {
      data[item.UUID] = { ...item, groupData: groups[item.group] }
      order.push(item.UUID)
    })

    return { data, order }
  }

  /**
   * Convert an ItemDataWithGroup to an ItemData
   * @description remove the group data from a ItemDataWithGroup
   * @param item
   */
  itemWithGroupToItemData(item: ItemDataWithGroup): ItemData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { groupData, ...itemData } = item
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

  /**
   * Save items
   * @param changes
   * @param UUID
   */
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
