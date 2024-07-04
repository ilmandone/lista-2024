import { Component, effect, inject, input, output } from '@angular/core'
import { MatInputModule } from '@angular/material/input'
import { FocusInputService } from '../../shared/focus-input.service'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
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

  key = input.required<number | string>()
  value = input<string | number>()
  disabled = input<boolean>(false)

  focused = output<boolean>()
  change = output<Nullable<string | number>>()

  fC = new FormControl<Nullable<string | number>>({
    value: null,
    disabled: true
  }, {})

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
    this._focusSrv.setUUID = this.key()
    this.focused.emit(true)
  }

  onBlur() {
    this._focusSrv.setUUID = null
    this.focused.emit(false)
    this.change.emit(this.fC.value)
  }
}
