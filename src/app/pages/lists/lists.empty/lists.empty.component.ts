import { Component, output } from '@angular/core'
import { HeroImageComponent } from '../../../components/hero-image/hero-image.component'
import { MatButton } from '@angular/material/button'

@Component({
  selector: 'app-empty-lists',
  standalone: true,
  imports: [
    HeroImageComponent,
    MatButton
  ],
  templateUrl: './lists.empty.component.html',
  styleUrl: './lists.empty.component.scss'
})
export class ListsEmptyComponent {
  newList = output()
}
