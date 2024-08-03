import { BasicItemChange } from "./firebase.interfaces"

export class SetOfUniqueItemsChanged<T extends BasicItemChange> {
    private itemsChanges: T[] = []

    add(change: T) {
        const index = this.itemsChanges.findIndex(item => item.UUID === change.UUID && item.crud !== 'create')

        // Remove the item if already exists
        if(index !== -1)
            this.itemsChanges.splice(index, 1)

        this.itemsChanges.push(change)
    }

    delete(change: T) {
        const index = this.itemsChanges.findIndex(item => item.UUID === change.UUID)

        if(index !== -1)
            this.itemsChanges.splice(index, 1)
    }

    values() {
        return [...this.itemsChanges]
    }
}