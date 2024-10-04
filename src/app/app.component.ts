import { Component, HostListener, inject, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { LoaderComponent } from './components/loader/loader.component'
import { MainStateService } from './shared/main-state.service'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import {
  OfflineAlertDialogComponent
} from './components/offline-alert-dialog/offline-alert-dialog.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  // private readonly _snackBarSrv = inject(SnackBarService)
  private readonly _mainStateSrv = inject(MainStateService)
  private readonly _dialog = inject(MatDialog)

  private _offlineDialog!: MatDialogRef<unknown> | undefined

  @HostListener('window:resize')
  protected updateBodyVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }

  @HostListener('window:offline')
  protected offline() {

    this._offlineDialog = this._dialog.open(OfflineAlertDialogComponent, {
      disableClose: true,
      panelClass: 'offline-alert-dialog'
    })

    this._mainStateSrv.setOffline(true)
  }

  @HostListener('window:online')
  protected online() {

    if (this._offlineDialog) {
      this._offlineDialog.close()
      this._offlineDialog = undefined
    }

    this._mainStateSrv.setOffline(false)
  }

  ngOnInit() {
    this.updateBodyVh();
  }
}
