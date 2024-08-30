import { Component, input, output } from '@angular/core'
import { Nullable } from 'app/shared/common.interfaces'

@Component({
	selector: 'app-color-picker',
	standalone: true,
	imports: [],
	templateUrl: './color-picker.component.html',
	styleUrl: './color-picker.component.scss'
})
export class ColorPickerComponent {
	value = input<Nullable<string>>()
	disabled = input<boolean>()
	valueChanged = output<Nullable<string>>()

	onChanged(event$: Event) {
    const e = event$.target as HTMLInputElement
		this.valueChanged.emit(e.value)
	}
}
