import {
  Component,
  ContentChild,
  effect,
  HostBinding,
  inject,
  input,
  output,
  TemplateRef
} from '@angular/core'
import { FocusInputService } from '../focus-input/focus-input.service'
import { MatButtonModule } from '@angular/material/button'
import { NgStyle, NgTemplateOutlet } from '@angular/common'

@Component({
  selector: 'app-confirm-cancel',
  standalone: true,
  imports: [MatButtonModule, NgStyle, NgTemplateOutlet],
  templateUrl: './confirm-cancel.component.html',
  styleUrl: './confirm-cancel.component.scss'
})
export class ConfirmCancelComponent{
  private _focusInput = inject(FocusInputService)

  cancelLabel = input<string>()
  confirmLabel = input<string>()
  confirmSize = input<number>(50)

  @ContentChild('cancelTemplate') cancelTemplate!: TemplateRef<HTMLElement>
  @ContentChild('confirmTemplate') confirmTemplate!: TemplateRef<HTMLElement>

  cancel = output()
  confirm = output()

  @HostBinding('class.hidden') hidden = false

  constructor() {
    effect(() => {
      this.hidden = this._focusInput.id() !== null
    })
  }
}
