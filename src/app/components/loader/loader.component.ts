import { Component, computed, input } from '@angular/core'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { Nullable } from '../../shared/common.interfaces'
import { CommonModule } from '@angular/common'
import { SpinnerColorDirective } from './directive/spinner-color.directive'

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, SpinnerColorDirective],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {
  bg = input<Nullable<string>>(null)
  color = input<Nullable<string>>(null)
  diameter = input<number>(30)
  loading = input.required<boolean>()
  mode = input.required<'determinate' | 'indeterminate'>()
  strokeWidth = input<number>(3)
  value = input<number>(0)

  test = computed(() => console.log(this.bg()))
}
