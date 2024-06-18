import {Component, inject} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatError, MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {Nullable} from "../../shared/utils";
import {LoaderComponent} from "../../components/loader/loader.component";
import {MatButton} from "@angular/material/button";
import {FirebaseService} from "../../shared/firebase.service";
import {SnackBarService} from "../../shared/snack-bar.service";

interface IForgotFG {
  email: FormControl<Nullable<string>>
}

@Component({
  selector: 'app-forgot-psw',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    LoaderComponent,
    MatButton,
  ],
  templateUrl: './forgot-psw.component.html',
  styleUrl: './forgot-psw.component.scss'
})
export class ForgotPswComponent {

  private _fbSrv = inject(FirebaseService);
  private _snackBarSrv = inject(SnackBarService);

  //#region FormGroup

  emailFC = new FormControl({value: null,  disabled:false}, [Validators.required, Validators.email]);
  forgotFG: FormGroup<IForgotFG> = new FormGroup<IForgotFG>({
    email: this.emailFC
  })

  submitted = false

  //#endregion

  forgotSubmit() {
    this.emailFC.disable()

    if (this.emailFC.value)
    this._fbSrv.resetWithPassword(this.emailFC.value)
      .then(() => {
        this.submitted = true
      })
      .catch(() => {
        this._snackBarSrv.show({
          message: 'Utente errato',
          severity: 'error',
        });
        this.emailFC.enable()
      })
  }
}
