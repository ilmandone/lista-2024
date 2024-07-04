import { Component, effect, inject } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'

import { CommonModule } from '@angular/common'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle'
import { ThemeService } from '../../shared/theme.service'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { LogoutDialogComponent } from './logout.dialog/logout.dialog.component'
import { FocusInputService } from '../../shared/focus-input.service'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatSidenavModule,
    CommonModule,
    RouterOutlet,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDialogModule
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  private readonly _fbSrv = inject(FirebaseService);
  private readonly _router = inject(Router);
  private readonly _dialog = inject(MatDialog);
  private readonly _focusSrv = inject(FocusInputService)

  readonly themeSrv = inject(ThemeService);

  disabled = false

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.uuid() !== null
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
