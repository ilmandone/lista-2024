import { Injectable, signal } from '@angular/core'
import { Nullable } from '../../shared/common.interfaces'

@Injectable({
  providedIn: 'root'
})
export class FocusInputService {

  id = signal<Nullable<string | number>>(null)

  set setID(value: Nullable<string | number>) {
    this.id.set(value)
  }
}
