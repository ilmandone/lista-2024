import { Component, computed, HostListener, inject, input, output } from '@angular/core'
import { MatRippleModule } from '@angular/material/core'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { CdkDragHandle } from '@angular/cdk/drag-drop'
import { MatIconButton } from '@angular/material/button'
import { FocusInputComponent } from '../focus-input/focus-input.component'
import { FocusInputService } from '../focus-input/focus-input.service'
import { ItemData, ItemsChanges } from 'app/data/firebase.interfaces'
import { Nullable } from 'app/shared/common.interfaces'
import { ItemSelectedEvent } from './item.interface'


@Component({
  selector: 'app-item',
  standalone: true,
  imports: [
    MatRippleModule,
    FocusInputComponent,
    MatCheckboxModule,
    MatIconModule,
    CdkDragHandle,
    MatIconButton
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss'
})
export class ItemComponent {
  readonly focusSrv = inject(FocusInputService)

  stroked = input<boolean>(true)
  data = input.required<ItemData>()
  editing = input<boolean>(false)
  selected = input<boolean>(false)
  extra = input<Nullable<string>>(null)
  shopping = input<boolean>(false)

  changed = output<ItemsChanges>()
  clicked = output<ItemsChanges>()
  selectedChange = output<ItemSelectedEvent>()

  disabled = false

  extraString = computed(() => this.extra() || '')

  @HostListener('click')
  hostClick() {
    if (!this.editing())
      this.clicked.emit({
        ...this.data(),
        inCart: this.shopping() ? !this.extra() : false,
        notToBuy: this.shopping() ? this.data().notToBuy : !this.stroked(),
        crud: 'update'
      })
  }

  /**
   * Updates the label of the item and emits a 'changed' event with the updated data.
   *
   * @param {Nullable<string>} $event - The new label for the item.
   */
  itemLabelChanged($event: Nullable<string>): void {
    if ($event) {
      this.changed.emit({
        ...this.data(),
        label: $event,
        notToBuy: false,
        crud: 'update'
      })
    }
  }

  /**
   * Emits an event with the UUID of the item and whether the checkbox is checked or not.
   *
   * @param {MatCheckboxChange} $event - The checkbox change event.
   */
  itemSelected($event: MatCheckboxChange): void {
    this.selectedChange.emit({
      UUID: this.data().UUID,
      isSelected: $event.checked
    })
  }
}
