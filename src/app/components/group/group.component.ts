import { Component, input, output } from '@angular/core'
import { GroupData } from 'app/data/firebase.interfaces'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { FocusInputComponent } from '../focus-input/focus-input.component'
import { GroupSelected } from './group.interface'
import { CdkDragHandle } from '@angular/cdk/drag-drop'
import { MatIconButton } from '@angular/material/button'

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [FocusInputComponent, MatCheckboxModule,
    MatIconModule, FocusInputComponent, CdkDragHandle, MatIconButton],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss'
})
export class GroupComponent {
  data = input.required<GroupData>()
  selected = input<boolean>()
  selectedChange = output<GroupSelected>()

  groupSelected($event:MatCheckboxChange) {
    this.selectedChange.emit({
      UUID: this.data().UUID,
      isSelected: $event.checked
    })
  }
}
