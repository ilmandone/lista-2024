import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button'
import { MatDialogActions, MatDialogModule, MatDialogTitle } from '@angular/material/dialog'

@Component({
  selector: 'app-shopping-cancel-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogModule,
    MatDialogTitle
  ],
  templateUrl: './shopping.cancel.dialog.component.html',
  styles: ''
})
export class ShoppingCancelDialogComponent {}
