/**
 * CREATE, UPDATE AND DELETE ITEMS IN A LIST
 */
import {
  GroupData,
  ItemDataWithGroup,
  ItemsChanges,
  ItemsData,
  ItemsDataWithGroup
} from '../../data/firebase.interfaces'
import { cloneDeep } from 'lodash'
import { v4 as uuidV4 } from 'uuid'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'

/**
 * Add a new item to the itemData list and (add a change action for b/e update)
 * @param {string} label
 * @param {GroupData} groupData
 * @param {ItemData[]} data
 * @param insertAfter
 * @private
 */
export const addItem = (
	label: string,
	groupData: GroupData,
	data: ItemsDataWithGroup,
	insertAfter: number
): {
	itemsData: ItemsDataWithGroup
	changes: ItemsChanges[]
} => {
	const itemsData = cloneDeep(data)
	const newItem: ItemDataWithGroup = {
		UUID: uuidV4(),
		label,
		group: groupData.UUID,
		inCart: false,
		notToBuy: true,
		position: insertAfter + 1,
		groupData
	}

	if (insertAfter === data.length - 1) itemsData.push(newItem)
	else {
		itemsData.splice(insertAfter + 1, 0, newItem)
	}

	return {
		itemsData,
		changes: [
			{
				UUID: newItem.UUID,
				label,
				position: newItem.position,
				group: newItem.group,
        inCart: newItem.inCart,
        notToBuy: newItem.notToBuy,
				crud: 'create'
			}
		]
	}
}

/**
 * Delete one or more items
 * @param {string[]} UUIDs
 * @param {ItemsData} data
 * @private {itemsData: ItemsData}
 */
export const deleteItem = (
	UUIDs: string[],
	data: ItemsDataWithGroup
): {
	itemsData: ItemsDataWithGroup
	changes: ItemsChanges[]
} => {
	const itemsData = cloneDeep(data)
	const dPositions: number[] = []
	const changes: ItemsChanges[] = []

	UUIDs.forEach((UUID) => {
		const deleteIndex = itemsData.findIndex((i) => i.UUID === UUID)

		if (deleteIndex !== -1) {
			const d = itemsData[deleteIndex]
			dPositions.push(d.position)

			changes.push({
				UUID: d.UUID,
				label: d.label,
				group: d.group,
				position: d.position,
				inCart: d.inCart,
				notToBuy: d.notToBuy,
				crud: 'delete'
			})

			itemsData.splice(deleteIndex, 1)
		}
	})

	const sortedPosition = dPositions.sort()

	for (let i = sortedPosition[0]; i < itemsData.length; i++) {
		const item = itemsData[i]

		let j = sortedPosition.length - 1

		while (j >= 0) {
			const p = sortedPosition[j]
			if (item.position >= p) {
				item.position -= j + 1
				changes.push({
					UUID: item.UUID,
					label: item.label,
					group: item.group,
					position: item.position,
					inCart: item.inCart,
					notToBuy: item.notToBuy,
					crud: 'update'
				})
				break
			}
			j--
		}
	}

	return { itemsData, changes }
}

/**
 * Update item attributes
 * @description Return an update itemsData list and the changes for b/e
 * @param {ItemsChanges} change
 * @param {ItemsData} data
 * @param {GroupData} groupData
 * @return {{changes: ItemsChanges[], itemsData: ItemsData}} - An object containing the updated itemsData array and the change object.
 */
export const updateItemAttr = (
	change: ItemsChanges,
	data: ItemsDataWithGroup,
	groupData?: GroupData
): {
	changes: ItemsChanges[]
	itemsData: ItemsDataWithGroup
} => {
	const itemsData = cloneDeep(data)
	const item = itemsData.find((i) => i.UUID === change.UUID)

	if (item) {
		item.label = change.label
		item.notToBuy = change.notToBuy
    item.inCart = change.inCart
		item.group = change.group

		if (groupData) {
			item.groupData = groupData
		}
	}

	return { itemsData, changes: [change] }
}

/**
 * Update item position after drop
 * @param {CdkDragDrop<ItemsData>} $event
 * @param {ItemsData} data
 */
export const updateItemPosition = (
	$event: CdkDragDrop<ItemsData>,
	data: ItemsDataWithGroup
): {
	itemsData: ItemsDataWithGroup
	changes: ItemsChanges[]
} => {
	const ld = cloneDeep(data)
	const changes: ItemsChanges[] = []
	const cI = $event.currentIndex
	const pI = $event.previousIndex

	// Update the list order
	if (ld) {
		moveItemInArray(ld, pI, cI)
	}

	// Start depends on sort order and could be the original or the new position
	const start = cI < pI ? cI : pI

	// Register all the new position into the itemsChanges list
	for (let i = start; i < ld.length; i++) {
		const list = ld[i]
		list.position = i
		changes.push({
			UUID: list.UUID,
			label: list.label,
			position: i,
			inCart: list.inCart,
      notToBuy: list.notToBuy,
			group: list.group,
      crud: 'update'
		})
	}

	return { itemsData: ld, changes }
}
