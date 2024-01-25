import {Component, HostListener, inject, OnInit, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {PrimeNGConfig} from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {

  private _primeNGConfig = inject(PrimeNGConfig);

  @HostListener('window:resize')
  private _updateVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }

  ngOnInit() {
    this._primeNGConfig.ripple = true;
    this._updateVh()
  }
}
