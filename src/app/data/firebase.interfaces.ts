import { Nullable } from "app/shared/common.interfaces"

export interface ListData {
    UUID: string
    items: Nullable<unknown[]>
    label: string
    position: number
    updated: Date
}

export type ListsData = ListData[]