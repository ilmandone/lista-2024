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
import { Nullable } from '../../utils/commons';
import { FirebaseAuthentication } from '../../services/firebase/authe.service';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
	],
	templateUrl: './login.page.component.html',
	styleUrl: './login.page.component.scss',
})
export class LoginPageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _messageSrv = inject(MessageService);

	loginFG!: FormGroup<LoginFormGroup>;
	userFC!: FormControl<Nullable<string>>;
	pswFC!: FormControl<Nullable<string>>;

	loggingIn = false;

	beErrors: { user: Nullable<string>; psw: Nullable<string> } = {
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
			validators: [Validators.required],
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
	 * Reset the be error messages
	 * @param {string} key
	 */
	resetBeError(key: string) {
		this.beErrors = { ...this.beErrors, [key]: null };
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
				.then()
				.catch((e) => {
					this.loggingIn = false;

					switch (e.code as string) {
						case 'auth/user-not-found':
						case 'auth/invalid-email':
							this.beErrors = {
								...this.beErrors,
								user: 'Email errata',
							};
							break;
						case 'auth/wrong-password':
							this.beErrors = {
								user: null,
								psw: 'Password errata',
							};
							break;
						case 'auth/too-many-requests':
							this._messageSrv.add({
								key: 'et',
								severity: 'error',
								summary: 'Attenzione',
								detail: 'Troppi tentativi effettuati, riprova tra poco',
							});
							break;
					}
				});
		}
	}

	ngOnInit(): void {
		Object.assign(this, this._createFG());
	}
}
