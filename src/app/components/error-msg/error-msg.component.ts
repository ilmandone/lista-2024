import { Component, Input } from '@angular/core';
import { Nullable } from 'app/utils/commons';

@Component({
	selector: 'app-error-msg',
	standalone: true,
	imports: [],
	templateUrl: './error-msg.component.html',
	styleUrl: './error-msg.component.scss',
})
export class InputErrorMsgComponent {
	@Input() msg!: Nullable<string>;
}
