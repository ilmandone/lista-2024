import { Component, input, output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-focus-input',
  standalone: true,
  imports: [MatInputModule],
  templateUrl: './focus-input.component.html',
  styleUrl: './focus-input.component.scss'  
})
export class FocusInputComponent {
  value = input<string | number>()
  disabled = input<boolean>(false)

  focused = output<boolean>()

  editing = false

  onFocus() {
    this.editing = true
    this.focused.emit(true)
  }

  onBlur() {
    this.editing = false
    this.focused.emit(false)
  }
}
