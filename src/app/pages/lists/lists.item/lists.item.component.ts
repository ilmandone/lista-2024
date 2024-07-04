import { Component, effect, ElementRef, inject, input, OnInit, ViewChild } from '@angular/core'
import { ListData } from '../../../data/firebase.interfaces'
import { MatRippleModule } from '@angular/material/core'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { FocusInputComponent } from 'app/components/focus-input/focus-input.component'
import { FocusInputService } from '../../../shared/focus-input.service'

@Component({
	selector: 'app-lists-item',
	standalone: true,
	imports: [
		MatRippleModule,
		MatInputModule,
		MatFormFieldModule,
		MatButtonModule,
		MatIconModule,
		FocusInputComponent
	],
	templateUrl: './lists.item.component.html',
	styleUrl: './lists.item.component.scss',
})
export class ListsItemComponent implements OnInit {

  static readonly DOUBLE_TAP_TIME = 400
  static readonly FOCUS_DELAY = 100

  focusSrv = inject(FocusInputService)

	@ViewChild('input', { static: true }) inputEl!: ElementRef<HTMLInputElement>
  data = input.required<ListData>()

	editModeOn = input.required<boolean>()

  disabled = false
	time!: Date

  constructor() {
    effect(() => {
      this.disabled = this.focusSrv.uuid() !== null
    })
  }

	ngOnInit(): void {
		this.time = new Date(this.data().updated.seconds)
	}

	//#region Interactions

	deleteList() {
		console.log('DELETE THE LIST: ', this.data().label)
	}


}
