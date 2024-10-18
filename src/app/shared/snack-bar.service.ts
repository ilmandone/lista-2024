import {inject, Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarRef} from "@angular/material/snack-bar";
import {ISnackBar} from "../components/snack-bar/snack-bar.interface";
import {SnackBarComponent} from "../components/snack-bar/snack-bar.component";

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  private _snackBar = inject(MatSnackBar);

  show(options: ISnackBar, duration = 3000 ):  MatSnackBarRef<SnackBarComponent> {
    return this._snackBar.openFromComponent(SnackBarComponent, {
      panelClass: `snack-bar--${options.severity}`,
      duration,
      verticalPosition: 'top',
      data: options,
    })
  }

  dismiss(ref: MatSnackBarRef<SnackBarComponent>): void {
    ref.dismiss()
  }
}
