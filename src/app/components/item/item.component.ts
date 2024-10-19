import { CdkDragHandle } from '@angular/cdk/drag-drop'
import { CommonModule } from '@angular/common'
import { Component, computed, HostListener, inject, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MatRippleModule } from '@angular/material/core'
import { MatIconModule } from '@angular/material/icon'
import { ItemDataWithGroup, ItemsChanges } from 'app/data/firebase.interfaces'
import { Nullable } from 'app/shared/common.interfaces'
import { FocusInputComponent } from '../focus-input/focus-input.component'
import { FocusInputService } from '../focus-input/focus-input.service'
import { ItemSelectedEvent } from './item.interface'
import { revealHor } from './item.animation'
import { MainStateService } from '../../shared/main-state.service'

@Component({
	selector: 'app-item',
	standalone: true,
	imports: [
		CommonModule,
		MatRippleModule,
		FocusInputComponent,
		MatCheckboxModule,
		MatIconModule,
		CdkDragHandle,
		MatIconButton
	],
	templateUrl: './item.component.html',
	styleUrl: './item.component.scss',
	animations: [revealHor]
})
export class ItemComponent {
  readonly LONG_PRESS_TIMEOUT = 700
	readonly focusSrv = inject(FocusInputService)
  readonly mainStateSrv = inject(MainStateService)

  private _longPressTimeoutID: number | null = null

  //#region Input / Output

	stroked = input<boolean>(true)
	data = input.required<ItemDataWithGroup>()
	editing = input<boolean>(false)
	selected = input<boolean>(false)
	extra = input<Nullable<string>>(null)
	sortable = input<boolean>(true)
	shopping = input<boolean>(false)

	changed = output<ItemsChanges>()
	clicked = output<ItemsChanges>()
	groupChange = output<ItemsChanges>()
  longPress = output<void>()
	selectedChange = output<ItemSelectedEvent>()

  //#endregion

	disabled = computed(() => !(this.editing() && this.sortable()) )
	extraString = computed(() => this.extra() || '')

  //#region Long press

  /**
   * Clear the long press timeout and set to null
   * @private
   */
  private _clearLongPressTimeoutID() {
    window.clearTimeout(this._longPressTimeoutID!)
    this._longPressTimeoutID = null
  }

  /**
   * Long press pointer down
   * @description On pointer down start tracking press time and emit the event after a delay time
   * @param event$
   */
  @HostListener('pointerdown', ['$event'])
  pointerDown(event$: PointerEvent) {
    event$.preventDefault();

    if(this._longPressTimeoutID) {
      this._clearLongPressTimeoutID()
    }

    if (!this.editing())
      this._longPressTimeoutID = window.setTimeout(() => {
        if (!this.editing() && !this.shopping()) {
          this.longPress.emit()
          this._longPressTimeoutID = null
        }
      },this.LONG_PRESS_TIMEOUT)
  }

  /**
   * Clear long press pointer up timeout tracking
   * @param event$
   */
  @HostListener('pointerup', ['$event'])
  pointerUp(event$: PointerEvent) {
    event$.preventDefault();

    if(this._longPressTimeoutID) {
      this._clearLongPressTimeoutID()
    }
  }

  //#endregion

	@HostListener('click')
	hostClick() {
		if (!this.editing() && !this.mainStateSrv.offline()){
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { groupData, ...rest } = this.data();

			this.clicked.emit({
				...rest,
				inCart: this.shopping() ? !this.extra() : false,
				notToBuy: this.shopping() ? this.data().notToBuy : !this.stroked(),
				crud: 'update'
			})}
	}

	/**
	 * Updates the label of the item and emits a 'changed' event with the updated data.
	 *
	 * @param {Nullable<string>} $event - The new label for the item.
	 */
	itemLabelChanged($event: Nullable<string>): void {
		if ($event) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { groupData, ...rest } = this.data();

			this.changed.emit({
				...rest,
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

	/**
	 * Start group change
	 */
	changeGroup() {

    // TODO: Fix here -> this data contains the old data and not the new ones

    window.setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { groupData, ...rest } = this.data()

      this.groupChange.emit({
        ...rest,
        inCart: false,
        notToBuy: false,
        crud: 'update'
      })
    })
	}
}
