import { Component } from '@angular/core';
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

interface INewItemFG {
  label: FormControl<Nullable<string>>
}

@Component({
  selector: 'app-list-new-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    MatButton,
    MatDialogActions,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatDialogContent,
    MatDialogClose
  ],
  templateUrl: './list.new.dialog.component.html',
  styleUrl: './list.new.dialog.component.scss'
})
export class ListNewDialogComponent {
  readonly labelFC = new FormControl('', Validators.required)
  readonly newItemFG= new FormGroup<INewItemFG>({
    label: this.labelFC
  })
}
