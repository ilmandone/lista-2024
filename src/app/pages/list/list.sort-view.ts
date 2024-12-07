import { ItemsDataWithGroup } from 'app/data/firebase.interfaces'

/**
 * Sort items data by group position
 * @param {ItemDataWithGroup} data
 * @returns {ItemDataWithGroup}
 */
const listPositionView = (data: ItemsDataWithGroup): ItemsDataWithGroup => {
  return data.sort((a, b) => a.groupData.position - b.groupData.position)
}

/**
 * Sort items data by position
 * @param {ItemDataWithGroup}data
 * @returns {ItemDataWithGroup}
 */
const gridListView = (data: ItemsDataWithGroup): ItemsDataWithGroup => {
  return data.sort((a, b) => a.position - b.position)
}

/**
 * Sort list by name
 * @param data
 */
const labelListView = (data: ItemsDataWithGroup): ItemsDataWithGroup => {
  return data.sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  })
}

export type SortMode = 'position' | 'label' | 'group'

export interface SortFunctions {
  position: typeof listPositionView
  label: typeof labelListView
  group: typeof gridListView
}

export const sortFunctions: SortFunctions = {
  position: listPositionView,
  label: labelListView,
  group: gridListView
}
