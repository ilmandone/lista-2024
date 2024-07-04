import { Component, inject, input, output } from '@angular/core'
import { MatInputModule } from '@angular/material/input'
import { FocusInputService } from '../../shared/focus-input.service'

@Component({
  selector: 'app-focus-input',
  standalone: true,
  imports: [MatInputModule],
  templateUrl: './focus-input.component.html',
  styleUrl: './focus-input.component.scss'
})
export class FocusInputComponent {
  private _focusSrv = inject(FocusInputService)

  key = input.required<number | string>()
  value = input<string | number>()
  disabled = input<boolean>(false)

  focused = output<boolean>()

  onFocus() {
    this._focusSrv.setUUID = this.key()
    this.focused.emit(true)
  }

  onBlur() {
    this._focusSrv.setUUID = null
    this.focused.emit(false)
  }
}
