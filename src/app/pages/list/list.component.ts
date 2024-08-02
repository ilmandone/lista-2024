import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'
import { MatIcon } from '@angular/material/icon'
import { MatIconButton } from '@angular/material/button'
import { ItemData } from '../../data/firebase.interfaces'
import { Nullable } from '../../shared/common.interfaces'
import { LoaderComponent } from '../../components/loader/loader.component'
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet'
import {
  IListBottomSheetData,
  ListBottomSheetComponent
} from './list.bottom-sheet/list.bottom-sheet.component'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { ListItemComponent } from './list.item/list.item.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { ListNewDialogComponent } from './list.new.dialog/list.new.dialog.component'
import { ListItemSelectedEvent } from './list.item/list.item.interface'
import { cloneDeep } from 'lodash'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    MatIcon,
    MatIconButton,
    LoaderComponent,
    MatBottomSheetModule,
    ButtonToggleComponent,
    ConfirmCancelComponent,
    ListItemComponent,
    MatDialogModule
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
class ListComponent implements OnInit {
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _bottomSheet = inject(MatBottomSheet)
  private readonly _dialog = inject(MatDialog)

  private _UUID!: string

  itemsData = signal<Nullable<ItemData[]>>([])

  label!: string
  viewModeGrid = false
  editing = false
  shopping = false
  selectedItems = new Set<string>()

  async ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.params['label']

    this._firebaseSrv.loadList(this._UUID).then(r => {
      this.itemsData.set(r)
    })
  }

  //#region Editing

  private _addInListItem(label: string,  data: ItemData[]): {itemsData: ItemData[]} {
    const itemsData = cloneDeep(data)
    const newItem: ItemData = {
      UUID: self.crypto.randomUUID(),
      label,
      group: 'verdure',
      inCart: false,
      qt: 1,
      toBuy: true,
      position: data.length
    }

    itemsData.push(newItem)

    //TODO: Add the changes

    return {itemsData}
  }

  openNewListDialog() {
    const d = this._dialog.open(ListNewDialogComponent)

    d.afterClosed().subscribe(r => {
      console.log(r)
      this._addInListItem(r, this.itemsData() as ItemData[])
    })
  }

  //#endregion

  //#region Bottom menu

  /**
   * Open the button sheet and subscribe to the dismiss event
   */
  openButtonSheet() {
    const p = this._bottomSheet.open(ListBottomSheetComponent, {
      data: {
        viewModeGrid: this.viewModeGrid
      } as IListBottomSheetData
    })

    p.afterDismissed().subscribe((r: IListBottomSheetData) => {
      Object.assign(this, { ...r })
    })
  }

  //#endregion

  //#region Item

  itemSelected($event: ListItemSelectedEvent) {
    if ($event.isSelected)
      this.selectedItems.add($event.UUID)
    else
      this.selectedItems.delete($event.UUID)
  }

  //#endregion


}

export default ListComponent
