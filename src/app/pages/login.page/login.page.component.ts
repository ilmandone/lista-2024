import { Component, inject, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MAIN_TOAST_KEY, Nullable } from '../../utils/commons';
import { FirebaseAuthentication } from '../../services/firebase/authe.service';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputErrorMsgComponent } from 'app/components/error-msg/error-msg.component';

interface LoginFormGroup {
	username: FormControl<Nullable<string>>;
	password: FormControl<Nullable<string>>;
}

@Component({
	selector: 'app-login.page',
	standalone: true,
	imports: [
		NgOptimizedImage,
		ReactiveFormsModule,
		InputTextModule,
		ButtonModule,
		RippleModule,
		RouterModule,
		ToastModule,
		InputErrorMsgComponent,
	],
	templateUrl: './login.page.component.html',
	styleUrl: './login.page.component.scss',
})
export class LoginPageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _messageSrv = inject(MessageService);
	private _router = inject(Router);

	loginFG!: FormGroup<LoginFormGroup>;
	userFC!: FormControl<Nullable<string>>;
	pswFC!: FormControl<Nullable<string>>;

	loggingIn = false;

	errorMsg: { user: Nullable<string>; psw: Nullable<string> } = {
		user: null,
		psw: null,
	};

	/**
	 * Create the login form group and controls
	 * @private
	 * @return {{loginFG: FormGroup<LoginFormGroup>,
	 *     userFC: FormControl<Nullable<string>>,
	 *     pswFC: FormControl<Nullable<string>>}}
	 */
	private _createFG(): {
		loginFG: FormGroup<LoginFormGroup>;
		userFC: FormControl<Nullable<string>>;
		pswFC: FormControl<Nullable<string>>;
	} {
		const userFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required, Validators.email],
		});

		const pswFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required],
		});

		const loginFG = new FormGroup({
			username: userFC,
			password: pswFC,
		});

		return { loginFG, userFC, pswFC };
	}

	/**
	 * Handle login error string
	 * @param {string} errorCode
	 * @private
	 */
	private _handleLoginError(errorCode: string) {
		switch (errorCode) {
			case 'auth/user-not-found':
			case 'auth/invalid-email':
				this.errorMsg = {
					...this.errorMsg,
					user: 'Email errata',
				};
				break;
			case 'auth/wrong-password':
				this.errorMsg = {
					user: null,
					psw: 'Password errata',
				};
				break;
			case 'auth/too-many-requests':
				this._messageSrv.add({
					key: MAIN_TOAST_KEY,
					severity: 'error',
					summary: 'Attenzione',
					detail: 'Troppi tentativi effettuati, riprova tra poco',
				});
				break;
		}
	}

	/**
	 * Reset the be error messages
	 * @param {string} key
	 */
	resetBeError(key: string) {
		this.errorMsg = { ...this.errorMsg, [key]: null };
	}

	/**
	 * F/E validation on blur
	 * @param fc
	 * @param key
	 */
	blur(fc: FormControl, key: string): void {
		if (fc.errors) {
			switch (key) {
				case 'user':
					this.errorMsg.user = fc.errors['required']
						? 'Email richiesta'
						: 'Email non valida';
					break;
				case 'psw':
					this.errorMsg.psw = 'Password richiesta';
					break;
			}
		}
	}

	/**
	 * Login with authentication service
	 * @description If the auth fails a message is shown
	 */
	login() {
		const values = this.loginFG.value;

		if (values.username && values.password) {
			this.loggingIn = true;
			this._authSrv
				.login(values.username, values.password)
				.then(() => {
					this._router.navigate(['/']);
				})
				.catch((e) => {
					this.loggingIn = false;
					this._handleLoginError(e.code as string);
				});
		}
	}

	ngOnInit(): void {
		Object.assign(this, this._createFG());
	}
}
