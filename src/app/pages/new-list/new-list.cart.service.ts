import { Injectable } from '@angular/core';
import { SetOfItemsChanges } from '../../data/items.changes'
import { ItemsChanges } from '../../data/firebase.interfaces'

@Injectable()
export class NewListCartService {

  inCartUUID = new Set<string>()
  undoItemsChanges = new SetOfItemsChanges<ItemsChanges>()

  get haveUndo() {
    return this.undoItemsChanges.hasValues
  }

  get undos() {
    return this.undoItemsChanges
  }

  clearAll() {
    this.inCartUUID.clear()
    this.undoItemsChanges.clear()
  }

  setUndo(data: ItemsChanges[]) {
    this.undoItemsChanges.set(data)
  }

  removeUndo(UUID: string) {
    this.undoItemsChanges.removeByUUID(UUID)
  }
}
