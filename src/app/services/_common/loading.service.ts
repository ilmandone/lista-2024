import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class LoadingService {
	private _loading = signal(false);

	get visible(): WritableSignal<boolean> {
		return this._loading;
	}

	get isVisible(): boolean {
		return this._loading();
	}
}
