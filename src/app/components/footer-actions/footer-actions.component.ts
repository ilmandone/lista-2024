import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-footer-actions',
	standalone: true,
	imports: [ButtonModule],
	templateUrl: './footer-actions.component.html',
	styleUrl: './footer-actions.component.scss',
})
export class FooterActionsComponent {}
