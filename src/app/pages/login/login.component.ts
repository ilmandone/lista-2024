import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, effect, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FirebaseService } from 'app/shared/firebase.service';
import { Nullable } from '../../shared/utils';
import { signInWithEmailAndPassword } from 'firebase/auth';

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
export class LoginComponent implements OnInit {

  constructor() {
    effect(() => {
      if (this._fbSrv.isLogged().state) { 
        console.log('!!!!! LOGGED')
      } if(this._fbSrv.isLogged().error) {
        const e = this._fbSrv.isLogged().error
        
        switch(e) {
          case 'auth/user-not-found':
            console.log('User not found')
            break
          case 'auth/wrong-password':
            console.log('Wrong password')
            break
          default:
            console.log('ERROR', e)
        }
      }
    })
  }

  private _fbSrv = inject(FirebaseService);

  //#region Form controls and group

  emailFC = new FormControl(null, [Validators.required, Validators.email]);
  passwordFC = new FormControl(null, [Validators.required]);

  loginFG = new FormGroup<ILoginFG>({
    email: this.emailFC,
    password: this.passwordFC,
  });

  //#endregion

  loginSubmit() {
    this._fbSrv.login(
      this.loginFG.controls.email.value as string,
      this.loginFG.controls.password.value as string
    );
  }

  ngOnInit(): void {
    this._fbSrv.init();
  }
}
