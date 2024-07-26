import { ChangeDetectionStrategy, Component, effect, input, model, OnInit } from '@angular/core'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'

@Component({
  selector: 'app-button-toggle',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    MatIconButton
  ],
  templateUrl: './button-toggle.component.html',
  styleUrl: './button-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonToggleComponent implements OnInit
{
  active = false

  label = input<string>('')
  fontIcon = input<string>('')
  pressed = model<boolean>(false)
  disabled = input<boolean>(false)

  constructor() {
    effect(() => {
      this.active = this.pressed()
    })
  }

  ngOnInit() {
    if (!this.label() && !this.fontIcon()) {
      throw new Error('Toggle button: an icon or a label should be provided at last')
    }
  }

  clicked() {
    this.active = !this.active
    this.pressed.set(this.active)
  }
}
