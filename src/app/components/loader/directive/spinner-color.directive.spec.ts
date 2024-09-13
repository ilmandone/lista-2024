import { Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { SpinnerColorDirective } from './spinner-color.directive'

@Component({
	template: `<div appSpinnerColor="red">
		<svg>
			<circle></circle>
		</svg>
	</div>`
})
export class TestComponent {}
describe('SpinnerColorDirective', () => {
	let fixture: ComponentFixture<TestComponent>

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [TestComponent],
			imports: [SpinnerColorDirective]
		})
		fixture = TestBed.createComponent(TestComponent)
		fixture.detectChanges()
	})

	describe('when the directive is applied', () => {
		it('should set the stroke color of the spinner to the input color', () => {
			const div = fixture.nativeElement.querySelector('circle')
			expect(div.style.stroke).toBe('red')
		})
	})
})
