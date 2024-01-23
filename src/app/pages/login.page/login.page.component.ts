import { Component } from '@angular/core';
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-login.page',
  standalone: true,
    imports: [
        NgOptimizedImage
    ],
  templateUrl: './login.page.component.html',
  styleUrl: './login.page.component.scss'
})
export class LoginPageComponent {

}
