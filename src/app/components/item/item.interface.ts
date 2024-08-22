import { GroupData, ItemData } from "app/data/firebase.interfaces"

export interface ItemSelectedEvent {
  UUID: string
  isSelected: boolean
}
  
export interface ItemDataWithGroup extends ItemData {
	groupData?: GroupData
}