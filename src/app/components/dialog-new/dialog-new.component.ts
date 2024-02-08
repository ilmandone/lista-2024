import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
	selector: 'app-dialog-new',
	standalone: true,
	imports: [DialogModule],
	templateUrl: './dialog-new.component.html',
	styleUrl: './dialog-new.component.scss',
})
export class DialogNewComponent {
	@Input() visible: boolean = false;

	@Output() visibleChange = new EventEmitter<boolean>();
}
