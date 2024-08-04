import { Component, inject } from '@angular/core'
import { MatButton, MatButtonModule } from '@angular/material/button'
import { MatDialogActions, MatDialogModule, MatDialogRef, MatDialogTitle } from '@angular/material/dialog'
import { LogoutDialogComponent } from 'app/pages/main/logout.dialog/logout.dialog.component'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Nullable } from '../../../shared/common.interfaces'
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'


interface INewListFG {
  name: FormControl<Nullable<string>>
}

@Component({
  selector: 'app-new-lists.dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatButtonModule,
    MatDialogActions,
    MatDialogModule,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatInput,
    MatLabel
  ],
  templateUrl: './lists-new.dialog.component.html',
  styleUrl: './lists-new.dialog.component.scss'
})
export class ListsNewDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LogoutDialogComponent>)

  nameFC = new FormControl('', Validators.required)
  newListFG= new FormGroup<INewListFG>({
    name: this.nameFC
  })
}
