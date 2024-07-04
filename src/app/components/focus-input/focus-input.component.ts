import { Component, input } from '@angular/core';

@Component({
  selector: 'app-focus-input',
  standalone: true,
  imports: [],
  templateUrl: './focus-input.component.html',
  styleUrl: './focus-input.component.scss'
})
export class FocusInputComponent {
  value = input<string | number>()
  disabled = input<boolean>(false)

  editing = false
}
