import { CdkDragHandle } from '@angular/cdk/drag-drop'
import { Component, effect, inject, input, OnInit, output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatRippleModule } from '@angular/material/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { FocusInputComponent } from 'app/components/focus-input/focus-input.component'
import { FocusInputService } from '../../../components/focus-input/focus-input.service'
import { ListData, ListsItemChanges } from '../../../data/firebase.interfaces'
import { FirebaseService } from '../../../data/firebase.service'
import { Nullable } from '../../../shared/common.interfaces'
import { revealHor } from './lists.item.animation'
import { MainStateService } from '../../../shared/main-state.service'

@Component({
	selector: 'app-lists-item',
	standalone: true,
	imports: [
		MatRippleModule,
		MatInputModule,
		MatFormFieldModule,
		MatButtonModule,
		MatIconModule,
		FocusInputComponent,
		CdkDragHandle
	],
	templateUrl: './lists.item.component.html',
	styleUrl: './lists.item.component.scss',
	animations: [revealHor]
})
export class ListsItemComponent implements OnInit {
	private readonly _firebaseSrv = inject(FirebaseService)
	readonly focusSrv = inject(FocusInputService)
  readonly mainStateSrv = inject(MainStateService)

	data = input.required<ListData>()
	editing = input.required<boolean>()

	clicked = output<ListData>()
	changed = output<ListsItemChanges>()
	deleted = output<ListsItemChanges>()

	disabled = false
	time!: Date

	constructor() {
		effect(() => {
			this.disabled = this.focusSrv.id() !== null
		})
	}

	ngOnInit(): void {
		this.time = this._firebaseSrv.getDateFromTimeStamp(this.data().updated)
	}

	//#region Interactions

	deleteList() {
		this.deleted.emit({
			label: this.data().label,
			UUID: this.data().UUID,
			position: this.data().position,
			crud: 'delete'
		})
	}

	itemLabelChanged($event: Nullable<string>) {
		if ($event)
			this.changed.emit({
				label: $event,
				UUID: this.data().UUID,
				position: this.data().position,
				crud: 'update'
			})
	}

	//#endregion
	itemClicked() {
		if (!this.editing()) this.clicked.emit(this.data())
	}
}
