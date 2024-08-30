import {effect, inject, Injectable, signal} from '@angular/core';
import {DOCUMENT} from "@angular/common";
import {LocalStorageService} from "./local-storage.service";

export const THEME_LOCAL_STORAGE = 'dark-theme'

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _document = inject(DOCUMENT)
  private _localStorageSrv = inject(LocalStorageService);

  isDark = signal(false)

  constructor() {

    const checkLSTheme = this._localStorageSrv.getValue(THEME_LOCAL_STORAGE)

    if (checkLSTheme !== null) {
      this.isDark.set(checkLSTheme === 'true')
    }

    effect(() => {
      const themeLinkTag = this._document.getElementById('app-theme') as HTMLLinkElement
      if (themeLinkTag) {
        themeLinkTag.href = `${this.isDark() ? 'theme-dark' : 'theme-light'}.css`
        this._localStorageSrv.setValue(THEME_LOCAL_STORAGE, this.isDark().toString())
      }
    });
  }
}
