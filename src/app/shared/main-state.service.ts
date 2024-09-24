import { Injectable, signal } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class MainStateService {
  reload$ = new Subject<void>()

  private _loader = signal<boolean>(false)
  private _offLine = signal<boolean>(false)

  //#region Offline

  get offline() {
    return this._offLine.asReadonly()
  }

  setOffline(v: boolean) {
    this._offLine.set(v)
  }

  //#endregion

  //#region Loader

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

  //#endregion
}
