import {Component, OnInit} from '@angular/core';
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

interface LoginFormGroup {
  username: FormControl<string | null>;
  password: FormControl<string | null>;
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
  ],
  templateUrl: './login.page.component.html',
  styleUrl: './login.page.component.scss',
})
export class LoginPageComponent implements OnInit {
  loginFG!: FormGroup<LoginFormGroup>;
  userFC!: FormControl<string | null>;
  pswFC!: FormControl<string | null>;

  ngOnInit(): void {
    this.userFC = new FormControl<string | null>(null, {
      validators: [Validators.required],
    });

    this.pswFC = new FormControl<string | null>(null, {
      validators: [Validators.required],
    });

    this.loginFG = new FormGroup({
      username: this.userFC,
      password: this.pswFC,
    });
  }

  login() {
    console.log(this.loginFG.value);
  }
}
