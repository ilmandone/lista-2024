import { Component, inject, input, output } from '@angular/core'
import { MatRippleModule } from '@angular/material/core'
import { FocusInputComponent } from '../../../components/focus-input/focus-input.component'
import { FocusInputService } from '../../../components/focus-input/focus-input.service'
import { ItemData } from '../../../data/firebase.interfaces'
import { Nullable } from '../../../shared/common.interfaces'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { ListItemSelectedEvent } from './list.item.interface'

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [
    MatRippleModule,
    FocusInputComponent,
    MatCheckboxModule
  ],
  templateUrl: './list.item.component.html',
  styleUrl: './list.item.component.scss'
})
export class ListItemComponent {
  readonly focusSrv = inject(FocusInputService)

  data = input.required<ItemData>()
  editing = input<boolean>(false)

  selected = output<ListItemSelectedEvent>()

  disabled = false

  itemLabelChanged($event: Nullable<string>) {
    console.log($event)
  }

  itemSelected($event: MatCheckboxChange) {
    this.selected.emit({
      UUID: this.data().UUID,
      isSelected: $event.checked
    })
  }
}
