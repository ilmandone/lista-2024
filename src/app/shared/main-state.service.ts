import { Injectable, signal } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class MainStateService {

  showLoader = signal<boolean>(false)
  private _reload = signal<number>(0)

  get reload() {
    return this._reload.asReadonly()
  }

  triggerReload() {
    this._reload.update(value => value + 1)
  }
}
