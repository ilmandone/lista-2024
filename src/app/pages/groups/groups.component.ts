import { Component, effect, inject } from '@angular/core';
import { FocusInputService } from 'app/components/focus-input/focus-input.service';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [MatIconModule,MatButtonModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss'
})
class GroupsComponent {
  private readonly _focusSrv = inject(FocusInputService)
  private readonly _location = inject(Location)

  selectedGroups = new Set<string>()
  disabled = false

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.id() !== null
    })
  }

  goBack() {
    this._location.back()
  }

}

export default GroupsComponent