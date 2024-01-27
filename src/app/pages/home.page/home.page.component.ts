import {Component, effect, inject, Injector, OnInit} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {FirebaseAuthentication} from "../../services/firebase/authe";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home.page',
  standalone: true,
	imports: [ButtonModule, RippleModule],
  templateUrl: './home.page.component.html',
  styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit{

	private _authSrv = inject(FirebaseAuthentication)
	private _injector = inject(Injector)
	private _router = inject(Router)

	logOut() {
		void this._authSrv.logout()
	}

	ngOnInit() {
		effect(() => {
			const loggedIn = this._authSrv.isLoggedIn()
			if(!loggedIn) void this._router.navigate(['/login'])
		}, {injector: this._injector})
	}
}
