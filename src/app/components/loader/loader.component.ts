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
  bgTransparent = input<boolean>(true);
  diameter = input<number>(30)
  loading = input.required<boolean>()
  mode = input.required<'determinate' | 'indeterminate'>()
  strokeWidth = input<number>(3)
  value = input<number>(0)
}
