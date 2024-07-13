import { Component, effect, inject, input, output } from '@angular/core'
import { MatInputModule } from '@angular/material/input'
import { FocusInputService } from './focus-input.service'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { Nullable } from '../../shared/common.interfaces'

@Component({
  selector: 'app-focus-input',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule],
  templateUrl: './focus-input.component.html',
  styleUrl: './focus-input.component.scss'
})
export class FocusInputComponent {
  private _focusSrv = inject(FocusInputService)
  private _cache!: Nullable<string>

  key = input.required<number | string>()
  value = input<string>()
  disabled = input<boolean>(false)

  focused = output<boolean>()
  changed = output<Nullable<string>>()

  fC = new FormControl<Nullable<string>>({
    value: null,
    disabled: true
  }, {validators: [Validators.required]})

  constructor() {

    effect(() => {
      if (this.disabled()) this.fC.disable()
      else this.fC.enable()
    })

    effect(() => {
      const v = this.value()
      if (v) this.fC.setValue(v)
    })
  }

  onFocus() {
    this._focusSrv.setID = this.key()
    this.focused.emit(true)
    this._cache = this.fC.value
  }

  onBlur() {

    // No value -> restore value in fc
    if(this.fC.invalid) {
      this.fC.patchValue(this._cache)
      this.fC.updateValueAndValidity()
    }
    // Valid value -> emit change
    else {
      this.changed.emit(this.fC.value)
    }

    this._focusSrv.setID = null
    this.focused.emit(false)
  }
}
