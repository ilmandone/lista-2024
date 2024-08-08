import { Component, HostListener, inject, input, output } from '@angular/core'
import { MatRippleModule } from '@angular/material/core'
import { FocusInputComponent } from '../../../components/focus-input/focus-input.component'
import { FocusInputService } from '../../../components/focus-input/focus-input.service'
import { ItemsChanges, ItemData } from '../../../data/firebase.interfaces'
import { Nullable } from '../../../shared/common.interfaces'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { ListItemSelectedEvent } from './list.item.interface'
import { MatIconModule } from '@angular/material/icon'
import { CdkDragHandle } from '@angular/cdk/drag-drop'
import { MatIconButton } from '@angular/material/button'


@Component({
	selector: 'app-list-item',
	standalone: true,
	imports: [
		MatRippleModule,
		FocusInputComponent,
		MatCheckboxModule,
		MatIconModule,
		CdkDragHandle,
		MatIconButton
	],
	templateUrl: './list.item.component.html',
	styleUrl: './list.item.component.scss'
})
export class ListItemComponent {
	readonly focusSrv = inject(FocusInputService)

	notToBuy = input<boolean>(false)
	data = input.required<ItemData>()
	editing = input<boolean>(false)
	selected = input<boolean>(false)

	changed = output<ItemsChanges>()
	notToBuyChange = output<ItemsChanges>()
	selectedChange = output<ListItemSelectedEvent>()

	disabled = false

	@HostListener('click')
	hostClick() {
		this.notToBuyChange.emit({
			UUID: this.data().UUID,
			label: this.data().label,
			position: this.data().position,
			group: this.data().group,
			inCart: this.data().inCart,
			toBuy: this.notToBuy(),
			crud: 'update'
		})
	}

	itemLabelChanged($event: Nullable<string>) {
		if ($event) {
			this.changed.emit({
				UUID: this.data().UUID,
				label: $event,
				position: this.data().position,
				group: this.data().group,
				inCart: this.data().inCart,
				toBuy: true,
				crud: 'update'
			})
		}
	}

	itemSelected($event: MatCheckboxChange) {
		this.selectedChange.emit({
			UUID: this.data().UUID,
			isSelected: $event.checked
		})
	}
}
