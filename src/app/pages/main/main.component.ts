import { Component, effect, inject } from '@angular/core'
import { Router, RouterModule, RouterOutlet } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'

import { CommonModule } from '@angular/common'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle'
import { ThemeService } from '../../shared/theme.service'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { LogoutDialogComponent } from './logout.dialog/logout.dialog.component'
import { FocusInputService } from '../../components/focus-input/focus-input.service'
import { LoaderComponent } from '../../components/loader/loader.component'
import { MainStateService } from '../../shared/main-state.service'
import { AlertBarComponent } from '../../components/alert-bar/alert-bar.component'

@Component({
  selector: 'app-home',
  standalone: true,
	imports: [
		CommonModule,
		LoaderComponent,
		MatButtonModule,
		MatDialogModule,
		MatIconModule,
		MatSidenavModule,
		MatSlideToggleModule,
		RouterOutlet,
    AlertBarComponent,
    RouterModule,
	],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
class MainComponent {
  private readonly _fbSrv = inject(FirebaseService);
  private readonly _router = inject(Router);
  private readonly _dialog = inject(MatDialog);
  private readonly _focusSrv = inject(FocusInputService)

  readonly mainStateService = inject(MainStateService)
  readonly themeSrv = inject(ThemeService);

  disabled = false

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.id() !== null
    })
  }

  logOut() {
    const dr = this._dialog.open(LogoutDialogComponent)

    dr.afterClosed().subscribe(result => {
      if (result)
        this._fbSrv.logout().then(() => {
          void this._router.navigate(['/login']);
        });
    });
  }

  themeToggle($event: MatSlideToggleChange) {
    this.themeSrv.isDark.set($event.checked)
  }
}

export default MainComponent
