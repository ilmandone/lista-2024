import { Component, input } from '@angular/core'
import { ItemData } from '../../../data/firebase.interfaces'

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [],
  templateUrl: './list.item.component.html',
  styleUrl: './list.item.component.scss'
})
export class ListItemComponent {
  data = input.required<ItemData>()

}
