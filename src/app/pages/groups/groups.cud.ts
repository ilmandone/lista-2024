import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop"
import { GroupChanges, GroupData, GroupsData } from "app/data/firebase.interfaces"
import { cloneDeep } from "lodash"

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