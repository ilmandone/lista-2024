import { Component, inject } from '@angular/core'
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms'
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input'
import { Nullable } from '../../../shared/common.interfaces'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { ItemsDataWithGroup } from '../../../data/firebase.interfaces'

interface SearchItemsFG {
  search: FormControl<Nullable<string>>
}

export interface ListFindBottomSheetData {
  searchCbFN: (v: Nullable<string>) => ItemsDataWithGroup
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
    MatIcon,
    MatButton,
    MatError
  ],
  templateUrl: './list.find.bottom-sheet.component.html',
  styleUrl: './list.find.bottom-sheet.component.scss'
})
export class ListFindBottomSheetComponent {
  readonly data: ListFindBottomSheetData = inject(MAT_BOTTOM_SHEET_DATA)
  readonly searchItemFC = new FormControl<Nullable<string>>(null, [Validators.minLength(2)])
  readonly searchItemsFG = new FormGroup<SearchItemsFG>({
    search: this.searchItemFC
  })
  private _bottomSheetRef = inject(MatBottomSheetRef<ListFindBottomSheetComponent>)

  itemsFound: ItemsDataWithGroup = []

  searchItem() {
    if (this.searchItemFC.valid)
      this.itemsFound = this.data.searchCbFN(this.searchItemFC.value)
  }

  clear() {
    this.itemsFound = []
    this.searchItemFC.patchValue(null)
  }

  dismiss(UUID: string) {
    this._bottomSheetRef.dismiss(UUID)
  }
}
