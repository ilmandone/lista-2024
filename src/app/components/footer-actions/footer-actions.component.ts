import { Component, effect, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import {
	FooterActionsService,
	F_ACTIONS,
	F_VISIBILITY,
} from '../../services/_common/footer-actions.service';
import { fakeAsync } from '@angular/core/testing';

@Component({
	selector: 'app-footer-actions',
	standalone: true,
	imports: [ButtonModule],
	templateUrl: './footer-actions.component.html',
	styleUrl: './footer-actions.component.scss',
})
export class FooterActionsComponent {
	F_ACTIONS = F_ACTIONS;
	F_VISIBILITY = F_VISIBILITY;
	fASrv = inject(FooterActionsService);

	constructor() {
		effect(() => {
			if (this.fASrv.action() === F_ACTIONS.CANCEL)
				this.fASrv.visible = null;
		});
	}

	protected readonly fakeAsync = fakeAsync;
}
