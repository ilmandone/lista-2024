import { Nullable } from 'app/shared/common.interfaces'
import { Timestamp } from 'firebase/firestore'

export interface BasicItemChange {
	UUID: string,
  crud?: 'create' | 'update' | 'delete',
}

export interface ListData extends Pick<BasicItemChange, 'UUID'> {
	items: Nullable<unknown[]>
	label: string
	position: number
	updated: Timestamp
}

export type ListsData = ListData[]
export type IListsItemChanges = Omit<ListData, 'items' | 'updated'> & Pick<BasicItemChange, 'crud'>

export interface ItemData extends Pick<BasicItemChange, 'UUID'> {
	inCart: boolean
	label: string
	qt: number
	toBuy: boolean
	group: string
	position: number
}

export type ItemsData = ItemData[]
export type IItemsItemChanges = ItemData & Pick<BasicItemChange, 'crud'>

export interface EditBag<T> {
  created: T[]
  updated: T[]
  deleted: T[]
}
