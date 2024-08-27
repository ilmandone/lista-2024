import { Timestamp } from 'firebase/firestore'

export interface IIsLogged {
	state: boolean | null
	error?: string
}

export type IResetPsw = IIsLogged

export interface BasicItemChange {
	UUID: string
	crud?: 'create' | 'update' | 'delete'
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
}

export type ItemData = Omit<ItemsChanges, 'crud'>
export type ItemsData = ItemData[]

// Groups

export interface GroupChanges extends BasicItemChange {
	color: string
	label: string
	position: number
}

export type GroupData = Omit<GroupChanges, 'crud'>
export type GroupsData = GroupData[]

export interface EditBag<T> {
	created: T[]
	updated: T[]
	deleted: T[]
}

export interface GroupNew {
	label: string
	color: string
}