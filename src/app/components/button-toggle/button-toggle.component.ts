import { ChangeDetectionStrategy, Component, effect, input, model, OnInit } from '@angular/core'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { NgTemplateOutlet } from '@angular/common'

@Component({
  selector: 'app-button-toggle',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    NgTemplateOutlet
  ],
  templateUrl: './button-toggle.component.html',
  styleUrl: './button-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonToggleComponent implements OnInit
{
  label = input<string>('')
  fontIcon = input<string>('')
  disabled = input<boolean>(false)
  toggle = model<boolean>(false)

  ngOnInit() {
    if (!this.label() && !this.fontIcon()) {
      throw new Error('Toggle button: an icon or a label should be provided at last')
    }
  }

  clicked() {
    this.toggle.update(v => !v)
  }
}
