import { Injectable } from '@angular/core';
import { SetOfItemsChanges } from '../../data/items.changes'
import { ItemsChanges } from '../../data/firebase.interfaces'

@Injectable()
export class NewListCartService {

  private inCartUUID = new Set<string>()
  private _undoItemsChanges = new SetOfItemsChanges<ItemsChanges>()

  get haveUndo() {
    return this._undoItemsChanges.hasValues
  }

  get undos() {
    return this._undoItemsChanges
  }

  get inCart() {
    return this.inCartUUID
  }

  addInCart(UUID: string) {
    this.inCartUUID.add(UUID)
  }

  removeFromCart(UUID: string) {
    if (this.inCartUUID.has(UUID))
      this.inCartUUID.delete(UUID)
  }

  clearAll() {
    this.inCartUUID.clear()
    this._undoItemsChanges.clear()
  }

  setUndo(data: ItemsChanges[]) {
    this._undoItemsChanges.set(data)
  }

  removeUndo(UUID: string) {
    this._undoItemsChanges.removeByUUID(UUID)
  }
}
