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

  clearUndo() {
    this._undoItemsChanges.clear()
  }

  storeInCartItems(data: ItemsData) {
    data.forEach(d => {
      if (d.inCart) this._inCartUUID.add(d.UUID)
    })
    console.log(this._inCartUUID)
  }

  /**
   * On shopping confirm update items inCart and notToBuy values and return changes for save
   * @param items
   */
  finalizeItemsForShoppingConfirm(items: ItemsDataWithGroupRecord): {
    record: ItemsDataWithGroupRecord,
    changes: ItemsChanges[]
  } {
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

    return { record, changes }
  }

  /**
   * Update item undo and in cart position
   * @param iu
   * @param originalData
   */
  updateItemUndoAndInCart(iu: ItemData, originalData: ItemData) {
    this._undoItemsChanges.removeByUUID(iu.UUID)

    this._undoItemsChanges.set([{
      ...originalData,
      crud: 'update'
    }])

    if (iu.inCart) this._inCartUUID.add(iu.UUID)
    else this._inCartUUID.delete(iu.UUID)
  }
}
