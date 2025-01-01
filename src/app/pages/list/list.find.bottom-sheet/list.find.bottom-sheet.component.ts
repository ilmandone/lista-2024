import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatFormField, MatInput, MatLabel } from '@angular/material/input'
import { Nullable } from '../../../shared/common.interfaces'
import { MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet'
import { ItemsDataWithGroup } from '../../../data/firebase.interfaces'

interface SearchItemsFG {
  search: FormControl<Nullable<string>>
}

export interface ListFindBottomSheetData {
  searchCbFN: (v: Nullable<string>) => ItemsDataWithGroup[]
}

@Component({
  selector: 'app-list.find.bottom-sheet',
  standalone: true,
  imports: [
    FormsModule,
    MatInput,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatIconButton,
    MatIcon
  ],
  templateUrl: './list.find.bottom-sheet.component.html',
  styleUrl: './list.find.bottom-sheet.component.scss'
})
export class ListFindBottomSheetComponent {
  readonly data: ListFindBottomSheetData = inject(MAT_BOTTOM_SHEET_DATA)
  readonly searchItemFC = new FormControl<Nullable<string>>(null)
  readonly searchItemsFG = new FormGroup<SearchItemsFG>({
    search: this.searchItemFC
  })

  searchItem() {
    const items = this.data.searchCbFN(this.searchItemFC.value)
    console.log(items)
  }
}
