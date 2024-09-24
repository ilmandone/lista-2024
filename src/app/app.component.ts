import { Component, HostListener, inject, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { SnackBarService } from './shared/snack-bar.service'
import { MatSnackBarRef } from '@angular/material/snack-bar'
import { LoaderComponent } from './components/loader/loader.component'
import { MainStateService } from './shared/main-state.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  private readonly _snackBarSrv = inject(SnackBarService)
  private readonly _mainStateSrv = inject(MainStateService)

  offlineSnack!:MatSnackBarRef<unknown> | undefined

  @HostListener('window:resize')
  protected updateBodyVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }

  @HostListener('window:offline')
  protected offline() {
    this.offlineSnack = this._snackBarSrv.show({
      message: 'Offline',
      severity: 'error',
    }, 300000)

    this._mainStateSrv.setOffline(true)
  }



  @HostListener('window:online')
  protected online() {
    if (this.offlineSnack) {
      this.offlineSnack.dismiss()
      this.offlineSnack = undefined
    }
    this._mainStateSrv.setOffline(false)
  }

  ngOnInit() {
    this.updateBodyVh();
  }
}
