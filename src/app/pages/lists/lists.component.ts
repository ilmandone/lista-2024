import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ListsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { Nullable } from 'app/shared/common.interfaces'
import { ListsEmptyComponent } from './lists.empty/lists.empty.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { NewListsDialogComponent } from './new-lists.dialog/new-lists.dialog.component'
import { IListsItemChanged, ListsItemComponent } from './lists.item/lists.item.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import { FocusInputService } from '../../shared/focus-input.service'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'

import { cloneDeep } from 'lodash'

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, ListsEmptyComponent, MatDialogModule, ListsItemComponent,
    LoaderComponent, ConfirmCancelComponent],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss'
})
export class ListsComponent implements OnInit {
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _dialog = inject(MatDialog)
  private readonly _focusSrv = inject(FocusInputService)
  private _listDataCache!: Nullable<ListsData>

  listsData = signal<Nullable<ListsData>>(null)
  editModeOn = false
  disabled = false

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.id() !== null
    })
  }

  ngOnInit(): void {
    this._firebaseSrv.startDB()

    this._firebaseSrv.loadLists().then((r) => {
      this.listsData.set(r)
    })
  }

  //#region Interactions

  openCreateNew() {
    const dr = this._dialog.open(NewListsDialogComponent)
    dr.afterClosed().subscribe((result) => {
      console.log('NEW LIST NAME: ', result)
    })
  }

  clickTopButton() {
    if (!this.editModeOn) {
      this._listDataCache = cloneDeep(this.listsData())
      this.editModeOn = true
    }
    else this.openCreateNew()
  }

  onConfirm() {
    console.log('SAVE NEW LISTS')
    this.editModeOn = false

  }

  onCancel() {
    console.log(this._listDataCache)
    this.listsData.set(this._listDataCache)
    this.editModeOn = false
  }

  itemChanged($event: IListsItemChanged) {
    console.log($event)
    // TODO: Start from here
    // Update the current listsData with the new values -
  }

  //#endregion


}
