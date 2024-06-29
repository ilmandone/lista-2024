import { Component, input } from '@angular/core'
import { ListData } from '../../../data/firebase.interfaces'

@Component({
  selector: 'app-lists-item',
  standalone: true,
  imports: [],
  templateUrl: './lists.item.component.html',
  styleUrl: './lists.item.component.scss'
})
export class ListsItemComponent {
  data = input.required<ListData>()

}
