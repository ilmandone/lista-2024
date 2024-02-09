import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FirebaseAuthentication } from './services/firebase/authe.service';
import {ToastModule} from "primeng/toast";
import {MAIN_TOAST_KEY} from "./utils/commons";

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, ButtonModule, RouterModule, ToastModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
	private _primeNGConfig = inject(PrimeNGConfig);
	private _authSrv = inject(FirebaseAuthentication);

	@HostListener('window:resize')
	private _updateVh() {
		document.documentElement.style.setProperty(
			'--vh',
			`${window.innerHeight * 0.01}px`,
		);
	}

	protected readonly MAIN_TOAST_KEY = MAIN_TOAST_KEY;

	ngOnInit() {
		this._primeNGConfig.ripple = true;
		this._updateVh();
		this._authSrv.init();
	}
}
