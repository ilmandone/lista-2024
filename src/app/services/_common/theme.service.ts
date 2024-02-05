import { inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export enum Theme {
	LIGHT = 'light',
	DARK = 'dark',
}

@Injectable({
	providedIn: 'root',
})
export class ThemeService {
	private _document = inject(DOCUMENT);
	private _current = signal<Theme>(Theme.LIGHT);

	constructor() {}

	get theme() {
		return this._current;
	}

	/**
	 * Set specific theme and save status in _current
	 * @param {Theme} theme
	 */
	setTheme(theme: Theme) {
		const themeLinkTag = this._document.getElementById(
			'app-theme',
		) as HTMLLinkElement;
		if (themeLinkTag) {
			themeLinkTag.href = `${theme}.css`;
			this._current.set(theme);
		}
	}

	/**
	 * Toggle theme
	 */
	toggleTheme() {
		this.setTheme(
			this._current() === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
		);
	}
}
