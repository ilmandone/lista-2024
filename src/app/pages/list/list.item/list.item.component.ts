import { Component, inject, input, output } from '@angular/core'
import { MatRippleModule } from '@angular/material/core'
import { FocusInputComponent } from '../../../components/focus-input/focus-input.component'
import { FocusInputService } from '../../../components/focus-input/focus-input.service'
import { ItemsItemChanges, ItemData } from '../../../data/firebase.interfaces'
import { Nullable } from '../../../shared/common.interfaces'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { ListItemSelectedEvent } from './list.item.interface'
import { MatIconModule } from '@angular/material/icon'
import { CdkDragHandle } from '@angular/cdk/drag-drop'

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [
    MatRippleModule,
    FocusInputComponent,
    MatCheckboxModule,
    MatIconModule,
    CdkDragHandle
  ],
  templateUrl: './list.item.component.html',
  styleUrl: './list.item.component.scss'
})
export class ListItemComponent {
  readonly focusSrv = inject(FocusInputService)

  data = input.required<ItemData>()
  editing = input<boolean>(false)
  selected = input<boolean>(false)

  selectedChange = output<ListItemSelectedEvent>()
  changed = output<ItemsItemChanges>()

  disabled = false

  itemLabelChanged($event: Nullable<string>) {
    if ($event) {
      this.changed.emit({
        UUID: this.data().UUID,
        label: $event,
        position: this.data().position,
        group: this.data().group,
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
