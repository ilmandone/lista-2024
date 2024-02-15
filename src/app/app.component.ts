import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import {ConfirmationService, PrimeNGConfig} from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FirebaseAuthentication } from './services/firebase/authe.service';
import { ToastModule } from 'primeng/toast';
import {MAIN_CONFIRMATION_KEY, MAIN_TOAST_KEY} from './utils/commons';
import { LoaderComponent } from './components/loader/loader.component';
import { LoadingService } from './services/_common/loading.service';
import { FooterActionsComponent } from './components/footer-actions/footer-actions.component';
import {ConfirmDialogModule} from "primeng/confirmdialog";

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		RouterOutlet,
		ButtonModule,
		RouterModule,
		ToastModule,
		LoaderComponent,
		FooterActionsComponent,
		ConfirmDialogModule,
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
	providers: [ConfirmationService]
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
	protected readonly MAIN_CONFIRMATION_KEY = MAIN_CONFIRMATION_KEY

	public loadingSrv = inject(LoadingService);

	ngOnInit() {
		this._primeNGConfig.ripple = true;
		this._updateVh();
		this._authSrv.init();
	}
}
