import { Component, inject } from '@angular/core'
import { MainStateService } from '../../shared/main-state.service'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatFormField, MatInput, MatLabel } from '@angular/material/input'
import { MatIcon } from '@angular/material/icon'
import { MatIconButton } from '@angular/material/button'
import { MatTooltip } from '@angular/material/tooltip'

@Component({
  selector: 'app-search-item',
  standalone: true,
  imports: [ReactiveFormsModule, MatInput, MatLabel, MatFormField, MatIcon, MatIconButton, MatTooltip],
  templateUrl: './search-item.component.html',
  styleUrl: './search-item.component.scss'
})
export class SearchItemComponent {
  private _mainStateSrv = inject(MainStateService);
  searchFC: FormControl = new FormControl<string|null>(null)

  searchItem() {
    const val = this.searchFC.value
    if (val)
      this._mainStateSrv.searchingItem({
        val,
        dir : 'desc'
      })
  }
}
