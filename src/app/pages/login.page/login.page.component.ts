import { Component, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

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
  ],
  templateUrl: './login.page.component.html',
  styleUrl: './login.page.component.scss',
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup<any>;

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      username: new FormControl<string | null>(null,{
        validators: [Validators.required]
      }),
      password: new FormControl<string | null>(null, {
        validators: [Validators.required]
      }),
    });
  }

  login() {
    console.log(this.loginForm.value)
  }
}
