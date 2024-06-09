import { Component } from '@angular/core';
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatError, MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {Nullable} from "../../shared/utils";

interface ILoginFG {
  email: FormControl<Nullable<string>>
  password: FormControl<Nullable<string>>
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, MatButton, ReactiveFormsModule, MatFormField, MatInput, MatLabel, MatError],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  emailFC = new FormControl(null, [Validators.required])
  passwordFC = new FormControl(null, [Validators.required])

  loginFG= new FormGroup<ILoginFG>({
    email: this.emailFC,
    password: this.passwordFC
  })

  loginSubmit() {
    console.log(this.loginFG.value)
  }
}
