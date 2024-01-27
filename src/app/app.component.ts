import {Component, effect, HostListener, inject, Injector, OnInit, signal, ViewChild} from '@angular/core';
import {ActivatedRoute, RouterModule, RouterOutlet} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {PrimeNGConfig} from 'primeng/api';
import {FirebaseAuthentication} from "./services/firebase/authe";

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, ButtonModule, RouterModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {

	private _primeNGConfig = inject(PrimeNGConfig);
	private _authSrv = inject(FirebaseAuthentication)
	private _activatedRoute = inject(ActivatedRoute)

	constructor(private _injector: Injector) {}

	@HostListener('window:resize')
	private _updateVh() {
		document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
	}

	ngOnInit() {
		this._primeNGConfig.ripple = true;
		this._updateVh()
		this._authSrv.init()
	}
}
