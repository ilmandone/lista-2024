import { cloneDeep } from 'lodash'
import { BasicItemChange, EditBag } from './firebase.interfaces'

export class SetOfUniqueItemsChanged<T extends BasicItemChange> {
  private _itemsChanges: EditBag<T> = {
    created: [],
    updated: [],
    deleted: []
  }

  get values(): EditBag<T> {
    return cloneDeep(this._itemsChanges)
  }


  set(changes: T[]) {
    for (const change of changes) {

      if (change.crud === 'create') {
        this._itemsChanges.created.push(change)
        continue
      }

      const createdIndex = this._itemsChanges.created.findIndex(i => change.UUID === i.UUID)
      const updatedIndex = this._itemsChanges.updated.findIndex(i => change.UUID === i.UUID)

      if (change.crud === 'delete') {
        if (createdIndex !== -1)
          this._itemsChanges.created.splice(createdIndex, 1)
        else {

          if (updatedIndex !== -1)
            this._itemsChanges.updated.splice(updatedIndex,1)

          this._itemsChanges.deleted.push(change)
        }
        continue
      }

      if (createdIndex !== -1)

        this._itemsChanges.created[createdIndex] = {...change,  crud: 'create'}
      else {
        if (updatedIndex !== -1)
          this._itemsChanges.updated.splice(updatedIndex,1)
        this._itemsChanges.updated.push(change)
      }

    }
  }




  /*set values(changes: T[]) {
    this.itemsChanges = changes
  }

  add(change: T) {
    const index = this.itemsChanges.findIndex((item) => item.UUID === change.UUID)
    const wasCreate = index !== -1 ? this.itemsChanges[index].crud === 'create' : undefined
        let c = cloneDeep(change)

    // Remove the item if already exists
    if (index !== -1 && c.crud !== 'create') {
      this.itemsChanges.splice(index, 1)
    }

        if(wasCreate && c.crud !== 'delete') c = {...c, crud: 'create'}

        // A created and delete item will not affect the changes list
        if(wasCreate === true && c.crud === 'delete') return
    this.itemsChanges.push(c)
  }

  addMultiple(changes: T[]) {
    changes.forEach((change) => this.add(change))
  }

  delete(change: T) {
    const index = this.itemsChanges.findIndex((item) => item.UUID === change.UUID)

    if (index !== -1) this.itemsChanges.splice(index, 1)
  }*/
}
