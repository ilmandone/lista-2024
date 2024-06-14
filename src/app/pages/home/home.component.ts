import {Component, inject} from '@angular/core';
import {FirebaseService} from "../../shared/firebase.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  private _fbSrv = inject(FirebaseService);
  private _router = inject(Router)

  logOut() {

    this._fbSrv.logout().then(() => {
      void this._router.navigate(['/login'])
    })
  }
}
