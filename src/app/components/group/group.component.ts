import { CdkDragHandle } from '@angular/cdk/drag-drop'
import { Component, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { GroupChanges, GroupData } from 'app/data/firebase.interfaces'
import { Nullable } from '../../shared/common.interfaces'
import { ColorPickerComponent } from '../color-picker/color-picker.component'
import { FocusInputComponent } from '../focus-input/focus-input.component'
import { GroupSelected } from './group.interface'

@Component({
	selector: 'app-group',
	standalone: true,
	imports: [
		FocusInputComponent,
		MatCheckboxModule,
		MatIconModule,
		FocusInputComponent,
		CdkDragHandle,
		MatIconButton,
		ColorPickerComponent
	],
	templateUrl: './group.component.html',
	styleUrl: './group.component.scss'
})
export class GroupComponent {
	data = input.required<GroupData>()
	selected = input<boolean>()

	changed = output<GroupChanges>()
	selectedChange = output<GroupSelected>()

  
  colorChanged($event: Nullable<string>) {
		if($event) {
      this.changed.emit({
        ...this.data(),
        color: $event,
        crud: 'update'
      })
    }
	}

	labelChanged($event: Nullable<string>) {
		if ($event) {
			this.changed.emit({
				...this.data(),
				label: $event,
				crud: 'update'
			})
		}
	}

	groupSelected($event: MatCheckboxChange) {
		this.selectedChange.emit({
			UUID: this.data().UUID,
			isSelected: $event.checked
		})
	}

	
}
