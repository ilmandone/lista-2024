import { ItemsDataWithGroup } from "app/data/firebase.interfaces";

/**
 * Sort items data by group position
 * @param {ItemDataWithGroup} data 
 * @returns {ItemDataWithGroup}
 */
export const listToGridView = (data: ItemsDataWithGroup): ItemsDataWithGroup => {
  return data.sort((a, b) => a.groupData.position - b.groupData.position)
}

/**
 * Sort items data by position
 * @param {ItemDataWithGroup}data 
 * @returns {ItemDataWithGroup}
 */
export const gridToListView = (data: ItemsDataWithGroup): ItemsDataWithGroup => {  
  return data.sort((a, b) => a.position - b.position)
}