import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core'
import { ListData } from '../../../data/firebase.interfaces'

@Component({
  selector: 'app-lists-item',
  standalone: true,
  imports: [],
  templateUrl: './lists.item.component.html',
  styleUrl: './lists.item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListsItemComponent implements OnInit{
  data = input.required<ListData>()

  time!: Date

  ngOnInit(): void {
    this.time = new Date(this.data().updated.seconds)
  }

  clicked() {
    console.log('clicked')
  }
}
