import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {
  diameter = input<number>()
  loading = input.required<boolean>()
  mode = input.required<'determinate' | 'indeterminate'>()
  strokeWidth = input<number>()

}
