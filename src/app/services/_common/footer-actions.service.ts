import {Injectable, signal} from '@angular/core';
import {Nullable} from "../../utils/commons";

export enum FACTIONS {
	CONFIRM,
	CANCEL
}

export type FooterActions = Nullable<FACTIONS>

@Injectable({
	providedIn: 'root'
})
export class FooterActionsService {

	action = signal<FooterActions>(null, {equal: () => false})
	visible = false

}
