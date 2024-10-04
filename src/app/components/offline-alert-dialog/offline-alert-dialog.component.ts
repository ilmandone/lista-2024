import { Component } from '@angular/core'
import { MatDialogContent, MatDialogTitle } from '@angular/material/dialog'

@Component({
  selector: 'app-offline-alert-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent],
  template: `
    <h2 mat-dialog-title>Warning!</h2>
    <mat-dialog-content>
      No internet connection available
    </mat-dialog-content>
  `,
  styles:
    `
      // Dialog background color override in theme files
      h2,
      mat-dialog-content {
        color: white !important;
      }`
})
export class OfflineAlertDialogComponent {}
