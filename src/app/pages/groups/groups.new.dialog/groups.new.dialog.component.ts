import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button'
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog'
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Nullable } from '../../../shared/common.interfaces'

interface INewGroupFG {
  label: FormControl<Nullable<string>>
}

@Component({
  selector: 'app-groups-new-dialog',
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
    ReactiveFormsModule,
  ],
  templateUrl: './groups.new.dialog.component.html',
  styleUrl: './groups.new.dialog.component.scss'
})
export class GroupsNewDialogComponent {
  readonly labelFC = new FormControl('', Validators.required)
  readonly newGroupFG= new FormGroup<INewGroupFG>({
    label: this.labelFC
  })
}