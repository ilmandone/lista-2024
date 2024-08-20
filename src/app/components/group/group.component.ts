import { Component, input } from '@angular/core';
import { GroupData } from 'app/data/firebase.interfaces';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss'
})
export class GroupComponent {
  data = input<GroupData>()
}
