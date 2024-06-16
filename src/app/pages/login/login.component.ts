import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Component, effect, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators,} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FirebaseService} from 'app/shared/firebase.service';
import {Nullable} from '../../shared/utils';
import {SnackBarService} from "../../shared/snack-bar.service";
import {Router} from "@angular/router";

interface ILoginFG {
  email: FormControl<Nullable<string>>;
  password: FormControl<Nullable<string>>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatButton,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  private _fbSrv = inject(FirebaseService);
  private _snackBarSrv = inject(SnackBarService);
  private _router = inject(Router)


  constructor() {
    effect(() => {
      if(this._fbSrv.isLogged().error) {
        const e = this._fbSrv.isLogged().error

        switch(e) {
          case 'auth/user-not-found':
          case 'auth/invalid-email':
            this._snackBarSrv.show({message: 'Utente errato', severity: 'error'})
            break
          case 'auth/wrong-password':
            this._snackBarSrv.show({message: 'Password errata', severity: 'error'})
            break
          case 'auth/too-many-requests':
            this._snackBarSrv.show({message: 'Troppi tentativi. Utente bloccato', severity: 'error'})
            break
        }
      }
    })
  }

  //#region Form controls and group

  emailFC = new FormControl(null, [Validators.required, Validators.email]);
  passwordFC = new FormControl(null, [Validators.required]);
  loginFG = new FormGroup<ILoginFG>({
    email: this.emailFC,
    password: this.passwordFC,
  });

  loginSubmit() {
    this._fbSrv.login(
      this.loginFG.controls.email.value as string,
      this.loginFG.controls.password.value as string
    ).then(() => {
      void this._router.navigate(['/home'])
    });
  }

  //#endregion
}
