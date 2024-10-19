import { Component, effect, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ListData, ListsData, ListsItemChanges } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { Nullable } from 'app/shared/common.interfaces'
import { ListsEmptyComponent } from './lists.empty/lists.empty.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { ListsItemComponent } from './lists.item/lists.item.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import { FocusInputService } from '../../components/focus-input/focus-input.service'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { MainStateService } from '../../shared/main-state.service'
import { Router } from '@angular/router'
import { ListsNewDialogComponent } from './lists-new.dialog/lists-new.dialog.component'
import {
  DeleteConfirmDialogComponent
} from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'

import { cloneDeep } from 'lodash'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { addList, deleteList, updateListAttr, updateListPosition } from './lists.cud'
import { Subject, takeUntil } from 'rxjs'
import { MatTooltip } from '@angular/material/tooltip'
import { checkMobile } from 'app/shared/detect.mobile'
import { SnackBarService } from '../../shared/snack-bar.service'
import { LongPressDirective } from '../../shared/directives/long-press.directive'

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    ConfirmCancelComponent,
    ListsEmptyComponent,
    ListsItemComponent,
    LoaderComponent,
    LongPressDirective,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltip
  ],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss'
})
class ListsComponent implements OnInit, OnDestroy {
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _dialog = inject(MatDialog)
  private readonly _focusSrv = inject(FocusInputService)
  private readonly _route = inject(Router)
  private readonly _snackBarSrv = inject(SnackBarService)

  private _escKeyDisabled = false
  private _listDataCache!: Nullable<ListsData>
  private _itemsChanges = new SetOfItemsChanges<ListsItemChanges>()

  private _destroyed$ = new Subject<boolean>()

  readonly mainStateSrv = inject(MainStateService)

  listsData = signal<Nullable<ListsData>>(null)

  disabled = false
  editing = false
  isMobile = checkMobile()

  constructor() {
    effect(() => {
      this.disabled = this._focusSrv.id() !== null
    })
  }

  ngOnInit(): void {
    this._loadLists()

    this.mainStateSrv.reload$.pipe(takeUntil(this._destroyed$)).subscribe(async () => {
      this._loadLists()
    })
  }

  ngOnDestroy(): void {
    this._destroyed$.next(true)
    this._destroyed$.complete()
  }

  /**
   * Shortcuts for editing on desktop
   * @param $event
   */
  @HostListener('window:keyup', ['$event'])
  onKeyPress($event: KeyboardEvent) {
    if (this.isMobile) return

    const key = $event.key.toLowerCase()

    if (key === 'escape' && !this._escKeyDisabled && this.editing) {
      $event.preventDefault()
      this.onCancel()
      return
    }

    if ($event.shiftKey && $event.altKey) {
      $event.preventDefault()
      switch (key) {
        case 'a':
          if (!this._escKeyDisabled && this.editing) this.openCreateNew()
          break
        case 'enter':
          if (this.editing) this.onConfirm()
          break
        case 'e':
          if (!this.editing) this.startEditing()
          break
      }
    }
  }

  private startEditing(): void {
    this._listDataCache = cloneDeep(this.listsData())
    this.editing = true
  }

  //#region Privates

  /**
   * Load lists and show loading main element
   * @private
   */
  private _loadLists(): void {
    this.mainStateSrv.showLoader()
    this._firebaseSrv.loadLists().then((r) => {
      this.listsData.set(r)
      this.mainStateSrv.hideLoader()
    })
  }

  /**
   * Reset changes, cache after save
   * @private
   */
  private _resetAfterSave() {
    this._itemsChanges.clear()
    this._listDataCache = []
    this.mainStateSrv.hideLoader()
    this.editing = false
  }

  /**
   * Update lists on db and refresh the view
   * @private
   */
  private _saveLists(): void {
    this.mainStateSrv.showLoader()
    this._firebaseSrv.updateLists(this._itemsChanges.values)
      .then((r) => {
        this.listsData.set(r)
        this._resetAfterSave()

        this._snackBarSrv.show({
          message: 'Liste aggiornate',
          severity: 'info'
        })

      })
      .catch(() => {
        this.listsData.set(this._listDataCache)
        this._resetAfterSave()

        this._snackBarSrv.show({
          message: 'Aggiornamento fallito',
          severity: 'error'
        })
      })
  }

//#endregion

  //#region Main

  /**
   * Top button click
   * @description Start edit mode | Open the create new dialog
   */
  clickTopButton() {
    if (!this.editing) {
      this._listDataCache = cloneDeep(this.listsData())
      this.editing = true
    } else this.openCreateNew()
  }

  //#endregion

  //#region Interactions

  /**
   * Item click and jump to list page
   * @param $event
   */
  listClicked($event: ListData) {
    void this._route.navigate([`main`, 'list', $event.UUID], {
      state: {
        label: $event.label
      }
    })
  }

  /**
   * Open dialog for new list
   * @description On confirm add the new list in f/e data and update _itemsChanges
   */
  openCreateNew() {
    this._escKeyDisabled = true
    this._dialog
      .open(ListsNewDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        this._escKeyDisabled = false

        if (result) {
          const { changes, newListsData } = addList(
            result,
            this.listsData(),
            this._firebaseSrv.gewNewTimeStamp()
          )
          this.listsData.set(newListsData)
          this._itemsChanges.set(changes)
        }
      })
  }

  //#endregion

  //#region Editing

  /**
   * Update or delete list in listsData and add changes
   * @param {ListsItemChanges} $event
   */
  itemChanged($event: ListsItemChanges) {
    const { changes, newListsData } =
      $event.crud === 'update'
        ? updateListAttr($event, this.listsData() as ListsData)
        : deleteList($event, this.listsData() as ListsData)
    this.listsData.set(newListsData)
    this._itemsChanges.set(changes)
  }

  /**
   * On list drop update positions
   * @param {CdkDragDrop<ListsData>} $event
   */
  listsDrop($event: CdkDragDrop<ListsData>) {
    const { changes, newListData } = updateListPosition($event, this.listsData() as ListsData)
    this.listsData.set(newListData)
    this._itemsChanges.set(changes)
  }

  //#endregion

  //#region Confirm / Cancel

  /**
   * Confirm editing
   */
  onConfirm() {
    if (this._itemsChanges.hasDeletedItems) {
      const dr = this._dialog.open(DeleteConfirmDialogComponent)
      dr.afterClosed().subscribe((result) => {
        if (result) this._saveLists()
      })
    } else {
      this._saveLists()
    }
  }

  /**
   * Undo editing
   * @description Restore data from cache and reset changes list
   */
  onCancel() {
    this.listsData.set(this._listDataCache)
    this._itemsChanges.clear()
    this.editing = false
  }

  //#endregion
  longPressed() {
    this._listDataCache = cloneDeep(this.listsData())
    this.editing = true
  }
}

export default ListsComponent
