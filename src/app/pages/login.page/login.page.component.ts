import {Component, effect, EffectRef, ElementRef, inject, Injector, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from "primeng/ripple";
import {Router, RouterModule} from "@angular/router";
import {Nullable} from "../../utils/commons";
import {FirebaseAuthentication} from "../../services/firebase/authe";

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
		RouterModule
	],
	templateUrl: './login.page.component.html',
	styleUrl: './login.page.component.scss',
})
export class LoginPageComponent implements OnInit, OnDestroy {

	private _authSrv = inject(FirebaseAuthentication)
	private _router = inject(Router)
	private _loginEffectRef!: EffectRef

	loginFG!: FormGroup<LoginFormGroup>;
	userFC!: FormControl<Nullable<string>>;
	pswFC!: FormControl<Nullable<string>>;

	constructor(private _injector: Injector) {}

	/**
	 * Create the login form group and controls
	 * @private
	 * @return {{loginFG: FormGroup<LoginFormGroup>,
	 *     userFC: FormControl<Nullable<string>>,
	 *     pswFC: FormControl<Nullable<string>>}}
	 */
	private _createFG(): {
		loginFG: FormGroup<LoginFormGroup>,
		userFC: FormControl<Nullable<string>>,
		pswFC: FormControl<Nullable<string>>
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

		return {loginFG, userFC, pswFC}
	}

	login() {
		const values = this.loginFG.value

		if(values.username && values.password)
			void this._authSrv.login(values.username, values.password)
	}

	ngOnInit(): void {

		this._loginEffectRef = effect(() => {
			const loggedIn = this._authSrv.isLoggedIn()
			if(loggedIn) void this._router.navigate(['/home'])

		}, {injector: this._injector})

		Object.assign(this, this._createFG())
	}

	ngOnDestroy() {
		this._loginEffectRef && this._loginEffectRef.destroy()
	}
}
