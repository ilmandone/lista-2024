import { cloneDeep } from 'lodash'
import { BasicItemChange, ItemsChangesEditBag } from './firebase.interfaces'

export class SetOfUniqueItemsChanged<T extends BasicItemChange> {
  private _itemsChanges: ItemsChangesEditBag<T> = {
    created: [],
    updated: [],
    deleted: []
  }

  get values(): ItemsChangesEditBag<T> {
    return cloneDeep(this._itemsChanges)
  }


  set(changes: T[]) {
    for (const change of changes) {

      // Created
      if (change.crud === 'create') {
        this._itemsChanges.created.push(change)
        continue
      }

      const createdIndex = this._itemsChanges.created.findIndex(i => change.UUID === i.UUID)
      const updatedIndex = this._itemsChanges.updated.findIndex(i => change.UUID === i.UUID)

      // Deleted
      if (change.crud === 'delete') {

        // Remove a created item
        if (createdIndex !== -1)
          this._itemsChanges.created.splice(createdIndex, 1)
        else {

          // Clean update for the item deleted
          if (updatedIndex !== -1)
            this._itemsChanges.updated.splice(updatedIndex, 1)

          this._itemsChanges.deleted.push(change)
        }
        continue
      }

      // Update the created data with the updated
      if (createdIndex !== -1)
        this._itemsChanges.created[createdIndex] = { ...change, crud: 'create' }
      else {

        // Clean a previous update
        if (updatedIndex !== -1)
          this._itemsChanges.updated.splice(updatedIndex, 1)

        this._itemsChanges.updated.push(change)
      }
    }
  }
}
