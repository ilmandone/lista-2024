import { Injectable, signal } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class MainStateService {
  reload$ = new Subject<void>()

  private _loader = signal<boolean>(false)

  get loader() {
    return this._loader.asReadonly()
  }

  showLoader() {
    this._loader.set(true)
  }

  hideLoader() {
    this._loader.set(false)
  }

  triggerReload() {
    this.reload$.next()
  }
}
