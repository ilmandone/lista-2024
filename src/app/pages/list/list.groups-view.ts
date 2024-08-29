import { ItemsDataWithGroup } from "app/data/firebase.interfaces";

export const listToGridView = (data: ItemsDataWithGroup): ItemsDataWithGroup => {
  
  const newData = data.sort((a, b) => a.groupData.position - b.groupData.position)
  return newData
}

export const gridToListView = (data: ItemsDataWithGroup): ItemsDataWithGroup => {
  
  const newData = data.sort((a, b) => a.position - b.position)
  return newData
}