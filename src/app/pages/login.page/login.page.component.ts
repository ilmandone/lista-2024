import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from "primeng/ripple";
import {RouterModule} from "@angular/router";
import {Nullable} from "../../utils/commons";

interface LoginFormGroup {
  username: FormControl<Nullable<string>>;
  password: FormControl<Nullable<string>>;
}

@Component({
  selector: 'app-login.page',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    RouterModule
  ],
  templateUrl: './login.page.component.html',
  styleUrl: './login.page.component.scss',
})
export class LoginPageComponent implements OnInit {

  loginFG!: FormGroup<LoginFormGroup>;
  userFC!: FormControl<Nullable<string>>;
  pswFC!: FormControl<Nullable<string>>;

  /**
   * Create the login form group and controls
   * @private
   * @return {{loginFG: FormGroup<LoginFormGroup>,
   *     userFC: FormControl<Nullable<string>>,
   *     pswFC: FormControl<Nullable<string>>}}
   */
  private _createFG(): {
    loginFG: FormGroup<LoginFormGroup>,
    userFC: FormControl<Nullable<string>>,
    pswFC: FormControl<Nullable<string>>
  } {
    const userFC = new FormControl<Nullable<string>>(null, {
      validators: [Validators.required],
    });

    const pswFC = new FormControl<Nullable<string>>(null, {
      validators: [Validators.required],
    });

    const loginFG = new FormGroup({
      username: userFC,
      password: pswFC,
    });

    return {loginFG, userFC, pswFC}
  }

  ngOnInit(): void {
    Object.assign(this, this._createFG())
  }

  login() {
    console.log(this.loginFG.value);
  }
}
