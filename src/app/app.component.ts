import { Component, HostListener, inject, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { SnackBarService } from './shared/snack-bar.service'
import { MatSnackBarRef } from '@angular/material/snack-bar'
import { LoaderComponent } from './components/loader/loader.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  private readonly _snackBarSrv = inject(SnackBarService)

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
  }

  @HostListener('window:online')
  protected online() {
    if (this.offlineSnack) {
      this.offlineSnack.dismiss()
      this.offlineSnack = undefined
    }

  }

  ngOnInit() {
    this.updateBodyVh();
  }
}
