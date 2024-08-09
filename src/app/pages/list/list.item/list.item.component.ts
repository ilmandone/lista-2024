import { Component, HostListener, inject, input, output } from '@angular/core'
import { MatRippleModule } from '@angular/material/core'
import { FocusInputComponent } from '../../../components/focus-input/focus-input.component'
import { FocusInputService } from '../../../components/focus-input/focus-input.service'
import { ItemData, ItemsChanges } from '../../../data/firebase.interfaces'
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

  notToBuy = input<boolean>(true)
  data = input.required<ItemData>()
  editing = input<boolean>(false)
  selected = input<boolean>(false)
  inCart = input<boolean>(false)
  shopping = input<boolean>(false)

  changed = output<ItemsChanges>()
  click = output<ItemsChanges>()
  selectedChange = output<ListItemSelectedEvent>()

  disabled = false

  @HostListener('click')
  hostClick() {
    if (!this.editing)
      this.click.emit({
        ...this.data(),
        inCart: this.shopping() ? !this.inCart : false,
        notToBuy: this.shopping() ? this.data().notToBuy : !this.notToBuy(),
        crud: 'update'
      })
  }

  itemLabelChanged($event: Nullable<string>) {
    if ($event) {
      this.changed.emit({
        ...this.data(),
        label: $event,
        notToBuy: false,
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
