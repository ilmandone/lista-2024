import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from "@angular/router";
import { FirebaseService } from "../../shared/firebase.service";

import { CommonModule } from '@angular/common';
import { MatSidenavModule } from "@angular/material/sidenav";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatSidenavModule, CommonModule, RouterOutlet],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',  
})
export class MainComponent {

  private _fbSrv = inject(FirebaseService);
  private _router = inject(Router)

  logOut() {

    this._fbSrv.logout().then(() => {
      void this._router.navigate(['/login'])
    })
  }
}
