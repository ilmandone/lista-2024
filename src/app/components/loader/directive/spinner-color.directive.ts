import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core'
import { Nullable } from 'app/shared/common.interfaces'

@Directive({
	selector: '[appSpinnerColor]',
	standalone: true
})
export class SpinnerColorDirective implements AfterViewInit {
	@Input('appSpinnerColor') color: Nullable<string> = null

	constructor(private elem: ElementRef) {}

	ngAfterViewInit() {
		if (this.color) {
			const element = this.elem.nativeElement
			const circles = element.querySelectorAll('circle')
			circles.forEach((circle: HTMLElement) => {
				circle.style.stroke = this.color as string
			})
		}
	}
}
