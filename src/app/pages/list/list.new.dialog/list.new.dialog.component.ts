import { Component, inject } from '@angular/core'
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
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { ListGroupsBottomSheetComponent } from '../list.groups.bottom-sheet/list.groups.bottom-sheet.component'
import { CommonModule } from '@angular/common'

interface INewItemFG {
	label: FormControl<Nullable<string>>
	color: FormControl<Nullable<string>>
}

@Component({
	selector: 'app-list-new-dialog',
	standalone: true,
	imports: [
		CommonModule,
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

	private readonly _bottomSheet = inject(MatBottomSheet)
  
	groupData: GroupData = DEFAULT_GROUP

	readonly labelFC = new FormControl('', Validators.required)
	readonly groupFC = new FormControl(this.groupData.UUID)
	readonly newItemFG = new FormGroup<INewItemFG>({
		label: this.labelFC,
		color: this.groupFC
	})

	openGroupBottomSheet() {
		const bs = this._bottomSheet.open(ListGroupsBottomSheetComponent)
		
		bs.afterDismissed().subscribe((data: GroupData) => {
			this.groupData = data
			this.groupFC.setValue(data.UUID)
		})
	}
}
