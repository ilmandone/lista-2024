import { Component } from '@angular/core';
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {Nullable} from "../../shared/utils";

interface ILoginFG {
  email: FormControl<Nullable<string>>
  password: FormControl<Nullable<string>>
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, MatButton, ReactiveFormsModule, MatFormField, MatInput, MatLabel],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginFormGroup= new FormGroup<ILoginFG>({
    email: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [Validators.required]),
  })

  loginSubmit() {
    console.log(this.loginFormGroup.value)
  }
}
