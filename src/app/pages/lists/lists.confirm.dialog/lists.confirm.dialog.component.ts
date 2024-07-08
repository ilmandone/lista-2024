import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogActions, MatDialogModule, MatDialogTitle } from '@angular/material/dialog'

@Component({
  selector: 'app-lists-confirm-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogModule,
    MatDialogTitle
  ],
  templateUrl: './lists.confirm.dialog.component.html',
  styles: ''
})
export class ListsConfirmDialogComponent {}
