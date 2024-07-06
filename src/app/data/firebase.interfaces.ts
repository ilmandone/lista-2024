import { Nullable } from "app/shared/common.interfaces"
import {
  Timestamp,
} from 'firebase/firestore'

export interface ListData {
    UUID: string
    items: Nullable<unknown[]>
    label: string
    position: number
    updated: Timestamp
}

export type ListsData = ListData[]
