import { Component, input, output } from '@angular/core'

@Component({
  selector: 'app-group-color-picker',
  standalone: true,
  imports: [],
  templateUrl: './group-color-picker.component.html',
  styleUrl: './group-color-picker.component.scss'
})
export class GroupColorPickerComponent {
  value = input<string>()
  changed = output<string>()
}
