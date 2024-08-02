import { Component, inject, input } from '@angular/core'
import { MatRippleModule } from '@angular/material/core'
import { FocusInputComponent } from '../../../components/focus-input/focus-input.component'
import { FocusInputService } from '../../../components/focus-input/focus-input.service'
import { ItemData } from '../../../data/firebase.interfaces'
import { Nullable } from '../../../shared/common.interfaces'
import { MatCheckboxModule } from '@angular/material/checkbox'

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

  disabled = false

  itemLabelChanged($event: Nullable<string>) {
    console.log($event)
  }
}
