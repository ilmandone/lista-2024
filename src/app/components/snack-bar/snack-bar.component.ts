import {Component, HostBinding, inject, OnInit} from '@angular/core';
import {MAT_SNACK_BAR_DATA, MatSnackBarAction, MatSnackBarActions, MatSnackBarRef} from '@angular/material/snack-bar';
import {ISnackBar} from './snack-bar.interface';
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatIconButton} from "@angular/material/button";

@Component({
  selector: 'app-snack-bar',
  standalone: true,
  imports: [MatIconButton, MatSnackBarActions,MatSnackBarAction,MatButton, MatIcon],
  templateUrl: './snack-bar.component.html',
  styleUrl: './snack-bar.component.scss',
})
export class SnackBarComponent /*implements OnInit*/ {
  snackBarData: ISnackBar = inject(MAT_SNACK_BAR_DATA);
  snackBar = inject(MatSnackBarRef);

  dismiss() {
    this.snackBar.dismiss()
  }
}
