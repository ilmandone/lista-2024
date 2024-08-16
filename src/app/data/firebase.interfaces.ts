import { Timestamp } from 'firebase/firestore'

export interface BasicItemChange {
	UUID: string,
  	crud?: 'create' | 'update' | 'delete',
}

// Lists

export interface ListData extends Pick<BasicItemChange, 'UUID'> {
	label: string
	position: number
	updated: Timestamp
}

export type ListsData = ListData[]
export type ListsItemChanges = Omit<ListData, 'updated'> & Pick<BasicItemChange, 'crud'>

// Items

export interface ItemsChanges extends BasicItemChange {
	inCart: boolean
	label: string
  notToBuy: boolean
	group: string
	position: number
	[key:string]: unknown // ???
}

export type ItemData = Exclude<ItemsChanges, 'crud'>
export type ItemsData = ItemData[]

export interface EditBag<T> {
	created: T[]
	updated: T[]
	deleted: T[]
  }