import { Timestamp } from 'firebase/firestore'

export interface BasicItemChange {
	UUID: string,
  crud?: 'create' | 'update' | 'delete',
}

export interface ListData extends Pick<BasicItemChange, 'UUID'> {
	label: string
	position: number
	updated: Timestamp
}

export type ListsData = ListData[]
export type ListsItemChanges = Omit<ListData, 'updated'> & Pick<BasicItemChange, 'crud'>

export interface ItemData extends Pick<BasicItemChange, 'UUID'> {
	inCart: boolean
	label: string
	toBuy: boolean
	group: string
	position: number
}

export type ItemsData = ItemData[]
export type ItemsChanges = Omit<ItemData, 'toBuy' | 'inCart'> & Pick<BasicItemChange, 'crud'>

export interface ItemsChangesEditBag<T> {
  created: T[]
  updated: T[]
  deleted: T[]
}
