import {Component, inject, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PrimeNGConfig} from "primeng/api";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{

  private _primeNGConfig = inject(PrimeNGConfig)

  title = 'lista-2024';

  ngOnInit() {
    this._primeNGConfig.ripple = true
  }
}
