import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export enum DialogNewActionType {
	OK,
	CANCEL,
	ADD,
}
export type DialogNewAction = DialogNewActionType;

@Component({
	selector: 'app-dialog-new',
	standalone: true,
	imports: [DialogModule, ButtonModule],
	templateUrl: './dialog-new.component.html',
	styleUrl: './dialog-new.component.scss',
})
export class DialogNewComponent {
	@Input() visible: boolean = false;
	@Input() header!: string;
	@Input() showAdd = true;

	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() action = new EventEmitter<DialogNewAction>();

	dialogNewActionType = DialogNewActionType;

	closeDialog(action: DialogNewActionType) {
		this.action.emit(action);
		if (action !== DialogNewActionType.ADD) {
			this.visible = false;
			this.visibleChange.emit(this.visible);
		}
	}
}
