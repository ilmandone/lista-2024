import { Component, OnInit, inject } from '@angular/core';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { InputErrorMsgComponent } from 'app/components/error-msg/error-msg.component';
import { FirebaseAuthentication } from 'app/services/firebase/authe.service';
import { Nullable } from 'app/utils/commons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';

interface IResetPasswordFG {
	username: FormControl<Nullable<string>>;
}

@Component({
	selector: 'app-forgot-password.page',
	standalone: true,
	imports: [
		ButtonModule,
		RippleModule,
		ReactiveFormsModule,
		InputTextModule,
		InputErrorMsgComponent,
	],
	templateUrl: './forgot-password.page.component.html',
	styleUrl: './forgot-password.page.component.scss',
})
export class ForgotPasswordPageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);

	emailFC!: FormControl<Nullable<string>>;
	errorMsg!: Nullable<string>;
	resetPswFg!: FormGroup<IResetPasswordFG>;

	private _createResetPswFg(
		emailFC: FormControl<Nullable<string>>,
	): FormGroup<IResetPasswordFG> {
		return new FormGroup<IResetPasswordFG>({
			username: emailFC,
		});
	}

	blur() {
		if (this.emailFC.errors) {
			this.errorMsg = this.emailFC.errors['required']
				? 'Email richiesta'
				: 'Email non valida';
		}
	}

	focus() {
		this.errorMsg = null;
	}

	sendReq(): void {
		sendPasswordResetEmail(this._authSrv.auth, this.emailFC.value as string)
			.then(() => {
				console.log('DONE: Email sent');
			})
			.catch((e) => {
				switch (e.code) {
					case 'auth/user-not-found':
					case 'auth/invalid-email':
						this.errorMsg = 'Email non valida';
						break;
				}
			});
	}

	ngOnInit(): void {
		this.emailFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required, Validators.email],
		});
		this.resetPswFg = this._createResetPswFg(this.emailFC);

		// Continua da: https://firebase.google.com/docs/auth/web/manage-users?hl=it
	}
}
