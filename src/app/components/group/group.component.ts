import { Component, input, output } from '@angular/core'
import { GroupChanges, GroupData } from 'app/data/firebase.interfaces'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { FocusInputComponent } from '../focus-input/focus-input.component'
import { GroupSelected } from './group.interface'
import { CdkDragHandle } from '@angular/cdk/drag-drop'
import { MatIconButton } from '@angular/material/button'
import { Nullable } from '../../shared/common.interfaces'
import { GroupColorPickerComponent } from './group-color-picker/group-color-picker.component'

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [FocusInputComponent, MatCheckboxModule,
    MatIconModule, FocusInputComponent, CdkDragHandle, MatIconButton, GroupColorPickerComponent],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss'
})
export class GroupComponent {
  data = input.required<GroupData>()
  selected = input<boolean>()

  changed = output<GroupChanges>()
  selectedChange = output<GroupSelected>()

  groupLabelChanged($event: Nullable<string>) {
    if($event) {
      this.changed.emit({
        ...this.data(),
        label: $event,
        crud: 'update'
      })
    }
  }

  groupSelected($event:MatCheckboxChange) {
    this.selectedChange.emit({
      UUID: this.data().UUID,
      isSelected: $event.checked
    })
  }
}
