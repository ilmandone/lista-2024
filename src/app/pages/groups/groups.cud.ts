import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop"
import { GroupChanges, GroupData, GroupsData } from "app/data/firebase.interfaces"
import { cloneDeep } from "lodash"


export const deleteGroup = (
	UUIDs: string[],
	data: GroupsData
): {
	groupsData: GroupsData
	changes: GroupChanges[]
} => {
	const groupsData = cloneDeep(data)
	const dPositions: number[] = []
	const changes: GroupChanges[] = []

	UUIDs.forEach((UUID) => {
		const deleteIndex = groupsData.findIndex((i) => i.UUID === UUID)

		if (deleteIndex !== -1) {
			const d = groupsData[deleteIndex]
			dPositions.push(d.position)

			changes.push({
				UUID: d.UUID,
				label: d.label,
				position: d.position,
				color: d.color,
				crud: 'delete'
			})

			groupsData.splice(deleteIndex, 1)
		}
	})

	const sortedPosition = dPositions.sort()

	for (let i = sortedPosition[0]; i < groupsData.length; i++) {
		const item = groupsData[i]

		let j = sortedPosition.length - 1

		while (j >= 0) {
			const p = sortedPosition[j]
			if (item.position >= p) {
				item.position -= j + 1
				changes.push({
					UUID: item.UUID,
					label: item.label,
					position: item.position,
					color: item.color,
					crud: 'update'
				})
				break
			}
			j--
		}
	}

	return { groupsData, changes }
}

export const updateGroupAttr  = (
	change: GroupChanges,
	data: GroupsData
): {
	changes: GroupChanges[]
	groupsData: GroupsData
} => {
	const groupsData = cloneDeep(data)
	const item = groupsData.find((i) => i.UUID === change.UUID)

	if (item) {
		item.label = change.label
		item.color = change.color
	}

	return { groupsData, changes: [change] }
}

/**
 * 
 * @param $event 
 * @param data 
 * @returns 
 */
export const updateGroupPosition = (
	$event: CdkDragDrop<GroupData>,
	data: GroupsData
): {
	groupsData: GroupsData
	changes: GroupChanges[]
} => {
	const gd = cloneDeep(data)
	const changes: GroupChanges[] = []
	const cI = $event.currentIndex
	const pI = $event.previousIndex

	// Update the list order
	if (gd) {
		moveItemInArray(gd, pI, cI)
	}

	// Start depends on sort order and could be the original or the new position
	const start = cI < pI ? cI : pI

	// Register all the new position into the itemsChanges list
	for (let i = start; i < gd.length; i++) {
		const group = gd[i]
		group.position = i
		changes.push({
			UUID: group.UUID,
			label: group.label,
			position: i,
			color: group.color,
            crud: 'update'
		})
	}

	return { groupsData: gd, changes }
}