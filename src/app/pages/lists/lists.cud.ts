/**
 * CREATE, UPDATE AND DELETE LISTS IN THE MAIN PAGE
 */
import { Nullable } from '../../shared/common.interfaces'
import { ListsData, ListsItemChanges } from '../../data/firebase.interfaces'
import { cloneDeep } from 'lodash'
import { v4 as uuidV4 } from 'uuid'
import { Timestamp } from 'firebase/firestore'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'

/**
 * Update the lists in f/e data
 * @param {string} label
 * @param {ListsData} data
 * @param {Timestamp} newTimeStamp
 * @return New lists data and changes
 * @private
 */
export const addInListData = (
  label: string,
  data: Nullable<ListsData>,
  newTimeStamp: Timestamp
): {
  newListsData: ListsData
  changes: ListsItemChanges[]
} => {
  const newListsData = data ? cloneDeep(data) : []
  const newItem = {
    UUID: uuidV4(),
    label,
    position: data?.length ?? 0,
    items: null,
    updated: newTimeStamp
  }

  newListsData.push(newItem)

  return {
    newListsData,
    changes: [{ UUID: newItem.UUID, label, position: newItem.position, crud: 'create' }]
  }
}

/**
 * Delete the list from the f/e data
 * @param {ListsItemChanges} change
 * @param {ListsData} data
 * @return New lists data and changes
 * @private
 */
export const deleteInListData = (
  change: ListsItemChanges,
  data: ListsData
): {
  newListsData: ListsData
  changes: ListsItemChanges[]
} => {
  const newListsData = cloneDeep(data)
  const changes: ListsItemChanges[] = [change]
  const i = newListsData.findIndex((list) => list.UUID === change.UUID)

  if (i !== -1) {
    newListsData.splice(i, 1)
  }

  // Update all the positions -> following position changes will use this information
  // TODO: Perf start from i and not from the beginning
  newListsData.forEach((list) => {
    if (list.position > change.position) {
      list.position -= 1
      changes.push({
        UUID: list.UUID,
        label: list.label,
        position: list.position,
        crud: 'update'
      })
    }
  })

  return { newListsData, changes }
}

/**
 * Update list's position or / label in f/e data
 * @param {ListsItemChanges} change
 * @param {ListsData} data
 * @return New lists data and changes
 * @private
 */
export const updateInListData =(
  change: ListsItemChanges,
  data: ListsData
): {
  newListsData: ListsData
  changes: ListsItemChanges[]
} => {
  const newListsData = cloneDeep(data)
  const item = newListsData.find((list) => list.UUID === change.UUID)

  if (item) {
    item.label = change.label
  }

  return { newListsData, changes: [change] }
}

/**
 * Drag and drop completed
 * @description Update the data list order and save all the changes for the items position
 * @param {CdkDragDrop<ListsData>} $event
 * @param {ListsData} data
 */
export const updateListPosition = ($event: CdkDragDrop<ListsData>, data: ListsData): {
  newListData: ListsData,
  changes: ListsItemChanges[]
} => {
  const ld = cloneDeep(data)
  const cI = $event.currentIndex
  const pI = $event.previousIndex
  const changes: ListsItemChanges[] = []

  // Update the list order
  if (ld) {
    moveItemInArray(ld, pI, cI)
  }

  // Start depends on sort order and could be the original or the new position
  const start = cI < pI ? cI : pI

  // Register all the new position into the _itemsChanges list
  for (let i = start; i < ld.length; i++) {
    const list = ld[i]
    list.position = i
    changes.push({
      UUID: list.UUID,
      label: list.label,
      position: i,
      crud: 'update'
    })
  }

  return {newListData: ld,  changes}
}
