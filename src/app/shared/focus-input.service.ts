import { Injectable, signal } from '@angular/core'
import { Nullable } from './common.interfaces'

@Injectable({
  providedIn: 'root'
})
export class FocusInputService {

  uuid = signal<Nullable<string | number>>(null)

  set setUUID(value: Nullable<string | number>) {
    this.uuid.set(value)
  }
}
