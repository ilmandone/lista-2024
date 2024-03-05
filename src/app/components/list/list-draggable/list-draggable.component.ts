import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	Output,
	TemplateRef,
} from '@angular/core';
import { IListsData } from 'app/services/firebase/db.service';
import { Nullable } from 'app/utils/commons';
import { DragDropModule } from 'primeng/dragdrop';

export interface IDraggedEvent {
	draggedUUID: string;
	targetUUID: string;
	position: 'before' | 'after';
}

@Component({
	selector: 'app-list-draggable',
	standalone: true,
	imports: [DragDropModule, CommonModule],
	templateUrl: './list-draggable.component.html',
	styleUrl: './list-draggable.component.scss',
})
export class ListDraggableComponent {
	@Input({ required: true }) listData!: IListsData;
	@Input() editMode = false;
	@Input() template!: TemplateRef<unknown>;

	@Output() dragComplete = new EventEmitter<IDraggedEvent>();

	private _draggedElUUID!: Nullable<string>;
	private _draggedELIndex!: Nullable<number>;
	private _draggedUnderEl!: Nullable<HTMLElement>;
	private _draggedLastEl!: Nullable<HTMLElement>;

	onDrop($event: DragEvent) {
		console.log('@@@ ~ HomePageComponent ~ onDrop ~ $event:', $event);
	}

	dragEnd($event: DragEvent) {
		const srcElement = $event.target as HTMLElement;

		if (this._draggedLastEl) {
			this.dragComplete.emit({
				draggedUUID: this._draggedElUUID as string,
				targetUUID: this._draggedLastEl.getAttribute(
					'data-uuid',
				) as string,
				position: this._draggedLastEl.hasAttribute('style')
					? 'before'
					: 'after',
			});
		}

		// TODO: continuare da qui per calcolare la nuova posizione dell'item spostato
		// Se l'ultimo elemento colpito ha la trasformazione va messo dopo di lui se no prima
		srcElement.classList.remove('dragging');
		this._draggedElUUID =
			this._draggedELIndex =
			this._draggedUnderEl =
			this._draggedLastEl =
				null;

		document
			.querySelectorAll('.li-item')
			.forEach((el) => el.removeAttribute('style'));
	}
	dragStart($event: DragEvent) {
		const srcElement = $event.target as HTMLElement;
		srcElement.classList.add('dragging');
		this._draggedElUUID = srcElement.getAttribute('data-uuid');
		this._draggedELIndex = Number(srcElement.getAttribute('data-index'));
	}

	onDragLeave() {
		this._draggedUnderEl = null;
	}

	drag($event: DragEvent) {
		$event.preventDefault();
		const tus = document
			.elementsFromPoint($event.clientX, $event.clientY)
			.filter((el) => {
				return (
					el.getAttribute('data-uuid') !== this._draggedElUUID &&
					el.classList.contains('li-item')
				);
			});
		const tu = tus.length > 0 ? tus[0] : undefined;
		const draggedUnderUUID =
			this._draggedUnderEl?.getAttribute('data-UUID');

		if (tu) {
			const tuUUID = tu.getAttribute('data-uuid');
			if (draggedUnderUUID !== tuUUID) {
				this._draggedUnderEl = this._draggedLastEl = tu as HTMLElement;

				if (tu.hasAttribute('style')) tu.removeAttribute('style');
				else {
					const index = Number(tu.getAttribute('data-index'));
					const translation =
						index < (this._draggedELIndex as number)
							? '100%'
							: '-100%';
					tu.setAttribute(
						'style',
						`transform: translate3D(0,${translation}, 0);`,
					);
				}
			}
		} else {
			if (this._draggedUnderEl) {
				this._draggedUnderEl = null;
			}
		}
	}
}
