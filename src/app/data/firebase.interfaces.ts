import { Nullable } from "app/shared/common.interfaces"

export interface ListDataTimeStamp {
  nanoseconds: number
  seconds: number
}

export interface ListData {
    UUID: string
    items: Nullable<unknown[]>
    label: string
    position: number
    updated: ListDataTimeStamp
}

export type ListsData = ListData[]
