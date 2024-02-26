import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	HostListener,
	Input,
	Output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-list',
	standalone: true,
	imports: [CommonModule, ButtonModule],
	templateUrl: './list.component.html',
	styleUrl: './list.component.scss',
})
export class ListComponent {
	@Input() editMode!: boolean;
	@Input() label!: string;
	@Input() updated!: Date;

	@Output() delete = new EventEmitter();
	@Output() pointerDown = new EventEmitter();
	@Output() doublePointerDown = new EventEmitter();

	protected readonly DB_CLICK_DELAY = 350;
	private _dbClickTimeout!: number;
	private _couldBeDoubleClick = false;

	@HostListener('pointerdown', ['$event'])
	onPointerDown(event: PointerEvent) {
		event.preventDefault();
		this.pointerDown.emit();

		if (this._dbClickTimeout) clearTimeout(this._dbClickTimeout);

		if (!this._couldBeDoubleClick) {
			this._dbClickTimeout = window.setTimeout(() => {
				this._couldBeDoubleClick = false;
			}, this.DB_CLICK_DELAY);
			this._couldBeDoubleClick = true;
		} else {
			this._couldBeDoubleClick = false;
			this.doublePointerDown.emit();
		}
	}
}
