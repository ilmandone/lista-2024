import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { FirebaseAuthentication } from '../../services/firebase/authe.service';

@Component({
	selector: 'app-home.page',
	standalone: true,
	imports: [ButtonModule, RippleModule, RouterModule],
	templateUrl: './home.page.component.html',
	styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);

	logOut() {
		void this._authSrv.logout();
	}

	ngOnInit() {
		console.log('HOME STARTED');
	}
}
