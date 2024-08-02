import { CommonModule } from '@angular/common'
import { Component, effect, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatAnchor, MatButton } from '@angular/material/button'
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { Router, RouterLink } from '@angular/router'
import { HeroImageComponent } from 'app/components/hero-image/hero-image.component'
import { FirebaseService } from 'app/data/firebase.service'
import { LoaderComponent } from '../../components/loader/loader.component'
import { Nullable } from '../../shared/common.interfaces'
import { SnackBarService } from '../../shared/snack-bar.service'
import { ThemeService } from '../../shared/theme.service'

interface ILoginFG {
  email: FormControl<Nullable<string>>
  password: FormControl<Nullable<string>>
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatProgressSpinnerModule,
    LoaderComponent,
    RouterLink,
    MatAnchor,
    HeroImageComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
class LoginComponent {
  private _fbSrv = inject(FirebaseService)
  private _snackBarSrv = inject(SnackBarService)
  private _router = inject(Router)

  constructor(private themeSrv: ThemeService) {
    effect(() => {
      if (this._fbSrv.isLogged().error) {
        const e = this._fbSrv.isLogged().error

        switch (e) {
          case 'auth/user-not-found':
          case 'auth/invalid-email':
            this._snackBarSrv.show({
              message: 'Utente errato',
              severity: 'error'
            })
            break
          case 'auth/wrong-password':
            this._snackBarSrv.show({
              message: 'Password errata',
              severity: 'error'
            })
            break
          case 'auth/too-many-requests':
            this._snackBarSrv.show({
              message: 'Troppi tentativi. Utente bloccato',
              severity: 'error'
            })
            break
        }
      }
    })
  }

  //#region Form controls and group

  emailFC = new FormControl({ value: null, disabled: false }, [Validators.required, Validators.email])
  passwordFC = new FormControl({ value: null, disabled: false }, [Validators.required])
  loginFG = new FormGroup<ILoginFG>({
    email: this.emailFC,
    password: this.passwordFC
  })

  loginSubmit() {
    this.emailFC.disable()
    this.passwordFC.disable()

    this._fbSrv
      .login(this.loginFG.controls.email.value as string, this.loginFG.controls.password.value as string)
      .then(() => {
        void this._router.navigate(['/main'])
      })
      .catch(() => {
        this.emailFC.enable()
        this.passwordFC.enable()
      })
  }

  //#endregion
}

export default LoginComponent
