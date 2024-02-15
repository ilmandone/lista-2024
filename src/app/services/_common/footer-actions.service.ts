import { Injectable, signal } from '@angular/core';
import { Nullable } from '../../utils/commons';

export enum F_ACTIONS {
	CONFIRM,
	CANCEL,
	UNDO,
	REDO,
}

export enum F_VISIBILITY {
	CANCEL,
	CONFIRM_CANCEL,
	CART_EXIT,
}

export type FooterActions = Nullable<F_ACTIONS>;
export type FooterVisibility = Nullable<F_VISIBILITY>;

@Injectable({
	providedIn: 'root',
})
export class FooterActionsService {
	action = signal<FooterActions>(null, { equal: () => false });
	visible: FooterVisibility = null;
}
