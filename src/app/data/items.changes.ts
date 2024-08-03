import { cloneDeep } from 'lodash'
import { BasicItemChange } from './firebase.interfaces'

export class SetOfUniqueItemsChanged<T extends BasicItemChange> {
	private itemsChanges: T[] = []

	get values(): T[] {
		return [...this.itemsChanges]
	}

	set values(changes: T[]) {
		this.itemsChanges = changes
	}

	add(change: T) {
		const index = this.itemsChanges.findIndex((item) => item.UUID === change.UUID)
		const wasCreate = index !== -1 ? this.itemsChanges[index].crud === 'create' : false
        let c = cloneDeep(change)

		// Remove the item if already exists
		if (index !== -1 && c.crud !== 'create') {
			this.itemsChanges.splice(index, 1)
		}

        if(wasCreate && c.crud !== 'delete') c = {...c, crud: 'create'}

        // A created and delete item will not affect the changes list
        if(wasCreate && c.crud === 'delete') return
		this.itemsChanges.push(c)
	}

	addMultiple(changes: T[]) {
		changes.forEach((change) => this.add(change))
	}

	delete(change: T) {
		const index = this.itemsChanges.findIndex((item) => item.UUID === change.UUID)

		if (index !== -1) this.itemsChanges.splice(index, 1)
	}
}
