import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export enum DialogNewActionType {
	OK,
	CANCEL,
	ADD,
	SHOW
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
	@Input() showAdd = false;
	@Input() enabled = false

	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() action = new EventEmitter<DialogNewAction>();

	dialogNewActionType = DialogNewActionType;

	/**
	 * Action emitted by action buttons
	 * @param {DialogNewActionType} action
	 */
	actionDialog(action: DialogNewActionType) {
		this.action.emit(action);
		if (action !== DialogNewActionType.ADD) {
			this.visible = false;
			this.visibleChange.emit(this.visible);
		}
	}

	/**
	 * On dialog close emit a cancel action
	 */
	onHide() {
		this.action.emit(DialogNewActionType.CANCEL)
	}

	onShow() {
		this.action.emit(DialogNewActionType.SHOW)
	}
}
