import {
	Component,
	effect,
	HostListener,
	inject,
	Injector,
	OnInit,
} from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FirebaseAuthentication } from './services/firebase/authe.service';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, ButtonModule, RouterModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
	private _primeNGConfig = inject(PrimeNGConfig);
	private _authSrv = inject(FirebaseAuthentication);
	private _injector = inject(Injector);
	private _router = inject(Router);

	@HostListener('window:resize')
	private _updateVh() {
		document.documentElement.style.setProperty(
			'--vh',
			`${window.innerHeight * 0.01}px`,
		);
	}

	ngOnInit() {
		this._primeNGConfig.ripple = true;
		this._updateVh();
		this._authSrv.init();

		effect(
			() => {
				const isLogged = this._authSrv.isLoggedIn();
				if (isLogged === false) void this._router.navigate(['/login']);
				else if (this._router.url === '/login')
					void this._router.navigate(['/home']);
			},
			{ injector: this._injector },
		);
	}
}
