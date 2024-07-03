import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, input, OnInit, ViewChild } from '@angular/core'
import { ListData } from '../../../data/firebase.interfaces'
import { MatRippleModule } from '@angular/material/core'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

@Component({
	selector: 'app-lists-item',
	standalone: true,
	imports: [MatRippleModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule],
	templateUrl: './lists.item.component.html',
	styleUrl: './lists.item.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListsItemComponent implements OnInit {
  
  @ViewChild('input', { static: true }) inputEl!: ElementRef<HTMLInputElement>
	@HostBinding('class.editing') @Input() editModeOn!: boolean
  
	data = input.required<ListData>()
  
	static readonly DOUBLE_TAP_TIME = 400
	static readonly FOCUS_DELAY = 100
  
	private lastTapTS = new Date().getTime()
  
	time!: Date
  
	ngOnInit(): void {
    this.time = new Date(this.data().updated.seconds)
	}
  
  //#region Interactions

  deleteList() {
    console.log('DELETE THE LIST: ', this.data().label)
  }

  //#endregion
  
	/* tapped() {
		if (this.isEditing) return

		const tapTime = new Date().getTime()
		const tapLength = tapTime - this.lastTapTS

		if (tapLength < ListsItemComponent.DOUBLE_TAP_TIME && tapLength > 0) {
			this.isEditing = true

			window.setTimeout(() => {
				this.inputEl.nativeElement.focus()
			}, ListsItemComponent.FOCUS_DELAY)
		}

		this.lastTapTS = tapTime
	} */

	/* overlayHit() {
		this.isEditing = false
	} */
}
