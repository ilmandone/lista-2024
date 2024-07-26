import { Component, effect, HostBinding, inject, input, output } from '@angular/core'
import { FocusInputService } from '../focus-input/focus-input.service'
import { MatButtonModule } from '@angular/material/button'
import { NgStyle } from '@angular/common'

@Component({
  selector: 'app-confirm-cancel',
  standalone: true,
  imports: [MatButtonModule, NgStyle],
  templateUrl: './confirm-cancel.component.html',
  styleUrl: './confirm-cancel.component.scss'
})
export class ConfirmCancelComponent {
  private _focusInput = inject(FocusInputService)

  cancelLabel = input<string>()
  confirmLabel = input<string>()
  confirmSize = input<number>()

  cancel = output()
  confirm = output()

  @HostBinding('class.hidden') hidden = false

  constructor() {
    effect(() => {
      this.hidden = this._focusInput.id() !== null
    })
  }
}
