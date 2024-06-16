import {Component, effect, HostBinding, inject, OnInit} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {MatButtonModule} from "@angular/material/button";
import {FirebaseService} from "./shared/firebase.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  private _fbSrv = inject(FirebaseService);

  constructor() {}

  @HostBinding('window:resize')
  private _updateBodyVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }

  ngOnInit() {
    this._updateBodyVh();
  }
}
