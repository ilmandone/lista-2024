import { Component, effect, inject, input, OnInit, output } from '@angular/core'
import { ListData } from '../../../data/firebase.interfaces'
import { MatRippleModule } from '@angular/material/core'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { FocusInputComponent } from 'app/components/focus-input/focus-input.component'
import { FocusInputService } from '../../../shared/focus-input.service'
import { Nullable } from '../../../shared/common.interfaces'
import { FirebaseService } from '../../../data/firebase.service'

export type IListsItemChanges = Omit<ListData, 'items' | 'updated'> & {crud: 'create' | 'update' | 'delete'}

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
  private _firebaseSrv = inject(FirebaseService)

  data = input.required<ListData>()
	editModeOn = input.required<boolean>()

  changed = output<IListsItemChanges>()

  focusSrv = inject(FocusInputService)
  disabled = false
	time!: Date

  constructor() {
    effect(() => {
      this.disabled = this.focusSrv.id() !== null
    })
  }

	ngOnInit(): void {
		this.time = this._firebaseSrv.getDateFromTimeStamp(this.data().updated)
	}

	//#region Interactions

	deleteList() {
		console.log('DELETE THE LIST: ', this.data().label)
	}

  itemLabelChanged($event: Nullable<string>) {
    if ($event)
    this.changed.emit({
      label: $event,
      UUID: this.data().UUID,
      position: this.data().position,
      crud: 'update'
    })
  }

  //#endregion
}
