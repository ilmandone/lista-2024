import { cloneDeep } from 'lodash'
import { BasicItemChange, EditBag, EditBagKeysValues } from './firebase.interfaces'

export class SetOfItemsChanges<T extends BasicItemChange> {
  private _itemsChanges: EditBag<T> = {
    created: [],
    updated: [],
    deleted: []
  }

  /**
   * Returns a deep copy of the _itemsChanges property.
   * @return {EditBag<T>} A deep copy of the _itemsChanges property.
   */
  get values(): EditBag<T> {
    return cloneDeep(this._itemsChanges)
  }

  /**
   * Return true if edit bag have at last one item in its lists
   */
  get hasValues(): boolean {
    return this._itemsChanges.updated.length > 0
    || this._itemsChanges.created.length > 0
    || this._itemsChanges.deleted.length > 0
  }

  get hasDeletedItems(): boolean {
    return this._itemsChanges.deleted.length > 0
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

  /**
   * Remove an item from all or specified edit bag lists
   * @param UUID
   * @param keys
   */
  removeByUUID (UUID: string, keys = EditBagKeysValues) {

    keys.forEach(key => {
      const index = this._itemsChanges[key].findIndex(ic => ic.UUID === UUID)
      if (index) {
        this._itemsChanges[key].splice(index, 1)
      }
    })
  }

  clear() {
    this._itemsChanges = {
      created: [],
      updated: [],
      deleted: []
    }
  }
}
