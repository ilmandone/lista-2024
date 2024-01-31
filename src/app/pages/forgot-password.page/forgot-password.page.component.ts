import { Component, OnInit } from '@angular/core';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Nullable } from 'primeng/ts-helpers';

interface IResetPasswordFG {
	username: FormControl<Nullable<string>>;
}

@Component({
	selector: 'app-forgot-password.page',
	standalone: true,
	imports: [ButtonModule, RippleModule, ReactiveFormsModule, InputTextModule],
	templateUrl: './forgot-password.page.component.html',
	styleUrl: './forgot-password.page.component.scss',
})
export class ForgotPasswordPageComponent implements OnInit {
	resetPswFg!: FormGroup<IResetPasswordFG>;
	userFC!: FormControl<Nullable<string>>;

	private _createResetPswFg(
		userFC: FormControl<Nullable<string>>,
	): FormGroup<IResetPasswordFG> {
		return new FormGroup<IResetPasswordFG>({
			username: userFC,
		});
	}

	sendReq(): void {
		console.log(this.resetPswFg.value);
	}

	ngOnInit(): void {
		this.userFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required],
		});
		this.resetPswFg = this._createResetPswFg(this.userFC);
	}
}
