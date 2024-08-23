import { Component } from '@angular/core'
import {
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogTitle
} from '@angular/material/dialog'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Nullable } from '../../../shared/common.interfaces'
import { MatButton } from '@angular/material/button'
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { DEFAULT_GROUP } from 'app/data/firebase.defaults'
import { GroupData } from 'app/data/firebase.interfaces'

interface INewItemFG {
	label: FormControl<Nullable<string>>
	color: FormControl<Nullable<string>>
}

@Component({
	selector: 'app-list-new-dialog',
	standalone: true,
	imports: [
		MatButton,
		MatDialogActions,
		MatDialogClose,
		MatDialogContent,
		MatDialogTitle,
		MatError,
		MatFormField,
		MatInput,
		MatLabel,
		ReactiveFormsModule
	],
	templateUrl: './list.new.dialog.component.html',
	styleUrl: './list.new.dialog.component.scss'
})
export class ListNewDialogComponent {
  
	groupData: GroupData = DEFAULT_GROUP

	readonly labelFC = new FormControl('', Validators.required)
	readonly groupFC = new FormControl(this.groupData.UUID)
	readonly newItemFG = new FormGroup<INewItemFG>({
		label: this.labelFC,
		color: this.groupFC
	})

	openGroupBottomSheet() {
		console.log('openGroupBottomSheet')
	}
}
