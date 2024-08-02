import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'
import { MatIcon } from '@angular/material/icon'
import { MatIconButton } from '@angular/material/button'
import { ItemData } from '../../data/firebase.interfaces'
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
import { v4 as uuidV4 } from 'uuid'

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
  private _itemsDataCache: ItemData[] = []

  itemsData = signal<ItemData[]>([])

  editing = false
  label!: string
  selectedItems = new Set<string>()
  shopping = false
  viewModeGrid = false

  async ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']
    this.label = this._activatedRoute.snapshot.params['label']

    this._firebaseSrv.loadList(this._UUID).then(r => {
      this.itemsData.set(r)
    })
  }

  //#region Editing

  /**
   * Add a new item to the itemData list and (add a change action for b/e update)
   * @param {string} label
   * @param {ItemData[]} data
   * @param insertAfter
   * @private
   */
  private _addInListItem(label: string, data: ItemData[], insertAfter: number): {
    itemsData: ItemData[],
  } {
    const itemsData = cloneDeep(data)
    const newItem: ItemData = {
      UUID: uuidV4(),
      label,
      group: 'verdure',
      inCart: false,
      qt: 1,
      toBuy: true,
      position: insertAfter + 1
    }

    if (insertAfter === data.length - 1)
      itemsData.push(newItem)
    else {
      itemsData.splice(insertAfter, 0, newItem)
    }

    //TODO: Add the changes

    return { itemsData }
  }

  /**
   * Open the new item dialog
   */
  openNewItemDialog() {
    const d = this._dialog.open(ListNewDialogComponent)

    d.afterClosed().subscribe(r => {
      const selectedUUID = this.selectedItems.size > 0 ? this.selectedItems.values().next().value : null

      const insertAfter =
        selectedUUID
          ? this.itemsData().find(e => e.UUID === selectedUUID)?.position ?? this.itemsData().length - 1
          : this.itemsData().length - 1

      const { itemsData } = this._addInListItem(r, this.itemsData() as ItemData[], insertAfter)
      this.itemsData.set(itemsData)
    })
  }

  /**
   * Confirm shopping or editing mode
   */
  confirm() {
    if (this.shopping) {
      console.log('TODO: Remove the in cart value from all items and set toBuy to false')
      this.shopping = false
    } else {
      console.log('TODO: update the db')
      this.editing = false
      this._itemsDataCache = []
    }
  }

  /**
   * Cancel pressed in shopping or editing mode
   * @description Cancel shopping will remove all the in cart status from items. Cancel editing
   * will restore the cached data
   */
  cancel() {
    if (this.shopping) {
      console.log('TODO: Remove the in cart value from all items')
      this.shopping = false
    } else {
      this.editing = false
      this.itemsData.set(this._itemsDataCache)
      this._itemsDataCache = []
    }
  }

  //#endregion

  //#region Bottom menu

  /**
   * Open the button sheet and subscribe to the dismiss event
   * @description If editing is enable save items to cache
   */
  openButtonSheet() {
    const p = this._bottomSheet.open(ListBottomSheetComponent, {
      data: {
        viewModeGrid: this.viewModeGrid
      } as IListBottomSheetData
    })

    p.afterDismissed().subscribe((r: IListBottomSheetData) => {
      Object.assign(this, { ...r })
      if (this.editing) this._itemsDataCache = cloneDeep(this.itemsData())
    })
  }

  //#endregion

  //#region Item

  /**
   * Add or remove and item from the selectedItems set
   * @param {ListItemSelectedEvent} $event
   */
  itemSelected($event: ListItemSelectedEvent) {
    if ($event.isSelected)
      this.selectedItems.add($event.UUID)
    else
      this.selectedItems.delete($event.UUID)
  }

  //#endregion

}

export default ListComponent
