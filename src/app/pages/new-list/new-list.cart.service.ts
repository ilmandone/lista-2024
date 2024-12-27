import { Injectable } from '@angular/core'
import { SetOfItemsChanges } from '../../data/items.changes'
import {
  ItemData,
  ItemsChanges,
  ItemsData,
  ItemsDataWithGroupRecord
} from '../../data/firebase.interfaces'
import { cloneDeep } from 'lodash'

@Injectable()
export class NewListCartService {

  private _inCartUUID = new Set<string>()
  private _undoItemsChanges = new SetOfItemsChanges<ItemsChanges>()

  get haveUndo() {
    return this._undoItemsChanges.hasValues
  }

  get undos() {
    return this._undoItemsChanges
  }

  addInCart(UUID: string) {
    this._inCartUUID.add(UUID)
  }

  removeFromCart(UUID: string) {
    if (this._inCartUUID.has(UUID))
      this._inCartUUID.delete(UUID)
  }

  clearAll() {
    this._inCartUUID.clear()
    this._undoItemsChanges.clear()
  }

  setUndo(data: ItemsChanges[]) {
    this._undoItemsChanges.set(data)
  }

  storeInCartItems(data: ItemsData) {
    data.forEach(d => {
      if (d.inCart) this._inCartUUID.add(d.UUID)
    })
  }

  finalizeItemsForShoppingConfirm(items: ItemsDataWithGroupRecord): {record: ItemsDataWithGroupRecord, changes: ItemsChanges[]} {
    const record = cloneDeep(items)
    const changes: ItemsChanges[] = []
    this._inCartUUID.forEach(ic => {
      record[ic].inCart = false
      record[ic].notToBuy = true

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { groupData, ...itemData } = record[ic]

      changes.push({
        ...itemData,
        crud: 'update'
      })
    })

    return {record, changes}
  }

  updateItemUndoAndInCart(iu: ItemData, extraData?: ItemData) {

    const itemData = extraData ?? iu

    if (extraData)
      this._undoItemsChanges.removeByUUID(iu.UUID)

    this._undoItemsChanges.set([{
      ...itemData,
      crud: 'update'
    }])

    if (iu.inCart) this._inCartUUID.add(iu.UUID)
    else this._inCartUUID.delete(iu.UUID)
  }
}
