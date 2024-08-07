import { Injectable, signal } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class MainStateService {
  private _reload = signal<number>(0)

  private _loader = signal<boolean>(false)

  get loader() {
    return this._loader.asReadonly()
  }

  get reload() {
    return this._reload.asReadonly()
  }

  showLoader() {
    this._loader.set(true)
  }

  hideLoader() {
    this._loader.set(false)
  }

  triggerReload() {
    this._reload.update(value => value + 1)
  }
}
