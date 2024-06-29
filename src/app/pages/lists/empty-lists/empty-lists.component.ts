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
  templateUrl: './empty-lists.component.html',
  styleUrl: './empty-lists.component.scss'
})
export class EmptyListsComponent {
  newList = output()
}
