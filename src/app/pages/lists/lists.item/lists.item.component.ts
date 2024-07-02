import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core'
import { ListData } from '../../../data/firebase.interfaces'
import { MatRippleModule } from '@angular/material/core'

@Component({
  selector: 'app-lists-item',
  standalone: true,
  imports: [MatRippleModule],
  templateUrl: './lists.item.component.html',
  styleUrl: './lists.item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListsItemComponent implements OnInit{

  static readonly DOUBLE_TAP_TIME = 400
  private lastTapTS = new Date().getTime()

  data = input.required<ListData>()

  time!: Date

  ngOnInit(): void {
    this.time = new Date(this.data().updated.seconds)
  }

  tapped() {
    const tapTime = new Date().getTime()
    const tapLength = tapTime - this.lastTapTS

    if (tapLength < ListsItemComponent.DOUBLE_TAP_TIME && tapLength > 0) {
      console.log('DOUBLE_TAP_TIME: ', tapLength)
    }

    this.lastTapTS = tapTime
  }
}
