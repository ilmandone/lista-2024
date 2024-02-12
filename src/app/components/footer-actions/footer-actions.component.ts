import {Component, effect, inject} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {FooterActionsService, FACTIONS} from "../../services/_common/footer-actions.service";

@Component({
	selector: 'app-footer-actions',
	standalone: true,
	imports: [ButtonModule],
	templateUrl: './footer-actions.component.html',
	styleUrl: './footer-actions.component.scss',
})
export class FooterActionsComponent {
	FACTIONS = FACTIONS
	fASrv = inject(FooterActionsService)

	constructor() {
		effect(() => {
			if(this.fASrv.action() === FACTIONS.CANCEL) this.fASrv.visible = false
		})
	}
}
