import {effect, inject, Injectable, signal} from '@angular/core';
import {DOCUMENT} from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private _document = inject(DOCUMENT)

  constructor() {
    effect(() => {

      const themeLinkTag = this._document.getElementById('app-theme') as HTMLLinkElement
      if (themeLinkTag) {
        themeLinkTag.href = `${this.isDark() ? 'theme-dark' : 'theme-light'}.css`
      }
    });
  }

  isDark = signal(false)
}
