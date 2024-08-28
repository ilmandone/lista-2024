import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'

export interface ListBottomSheetData {
  showByGroups?: boolean
  editing?: boolean
}

@Component({
  selector: 'app-list-bottom-sheet',
  standalone: true,
  imports: [
    MatButton,
    MatIcon
  ],
  templateUrl: './list.bottom-sheet.component.html',
  styleUrl: './list.bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBottomSheetComponent implements OnInit {
  private readonly _bottomSheetRef = inject(MatBottomSheetRef<ListBottomSheetComponent>)
  private readonly _bottomSheetData = inject(MAT_BOTTOM_SHEET_DATA)

  showByGroups = false

  ngOnInit() {
    Object.assign(this, { ...this._bottomSheetData })
  }

  starEdit($event: Event) {
    this._bottomSheetRef.dismiss({
      editing: true
    } as ListBottomSheetData)

    $event.preventDefault()
  }

  toggleViewMode($event: Event) {
    this.showByGroups = !this.showByGroups
    this._bottomSheetRef.dismiss({
      showByGroups: this.showByGroups
    } as ListBottomSheetData)

    $event.preventDefault()
  }
}

