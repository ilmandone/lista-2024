import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ListsItemChanges, ListData, ListsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { Nullable } from 'app/shared/common.interfaces'
import { ListsEmptyComponent } from './lists.empty/lists.empty.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { ListsItemComponent } from './lists.item/lists.item.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import { FocusInputService } from '../../components/focus-input/focus-input.service'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import {
	CdkDrag,
	CdkDragDrop,
	CdkDragPlaceholder,
	CdkDropList,
	moveItemInArray
} from '@angular/cdk/drag-drop'
import { MainStateService } from '../../shared/main-state.service'
import { Router } from '@angular/router'
import { ListsNewDialogComponent } from './lists-new.dialog/lists-new.dialog.component'
import { DeleteConfirmDialogComponent } from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'

import { cloneDeep } from 'lodash'
import { v4 as uuidV4 } from 'uuid'
import { SetOfItemsChanges } from 'app/data/items.changes'

@Component({
	selector: 'app-lists',
	standalone: true,
	imports: [
		MatIconModule,
		MatButtonModule,
		ListsEmptyComponent,
		MatDialogModule,
		ListsItemComponent,
		LoaderComponent,
		ConfirmCancelComponent,
		CdkDrag,
		CdkDropList,
		CdkDragPlaceholder
	],
	templateUrl: './lists.component.html',
	styleUrl: './lists.component.scss'
})
class ListsComponent implements OnInit {
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _dialog = inject(MatDialog)
	private readonly _focusSrv = inject(FocusInputService)
	private readonly _mainStateSrv = inject(MainStateService)
	private readonly _route = inject(Router)

	private _listDataCache!: Nullable<ListsData>
	private _itemsChanges = new SetOfItemsChanges<ListsItemChanges>()

	listsData = signal<Nullable<ListsData>>(null)

	disabled = false
	editing = false
	
	constructor() {
		effect(() => {
			this.disabled = this._focusSrv.id() !== null
		})

		effect(
			() => {
				if (this._mainStateSrv.reload()) {
					this._loadLists()
				}
			},
			{ allowSignalWrites: true }
		)
	}

	ngOnInit(): void {
		this._loadLists()
	}

	//#region Privates

	/**
	 * Load lists and show loading main element
	 * @private
	 */
	private _loadLists(): void {
		this._mainStateSrv.showLoader.set(true)
		this._firebaseSrv.loadLists().then((r) => {
			this.listsData.set(r)
			this._mainStateSrv.showLoader.set(false)
		})
	}

	/**
	 * Update lists on db and refresh the view
	 * @private
	 */
	private _saveLists(): void {
		this._mainStateSrv.showLoader.set(true)
		this._firebaseSrv.updateLists(this._itemsChanges.values).then((r) => {
			this.listsData.set(r)
			this._mainStateSrv.showLoader.set(false)
			this.editing = false
		})
	}

	/**
	 * Update the lists in f/e data
	 * @param {string} label
	 * @param {ListsData} data
	 * @return New lists data and changes
	 * @private
	 */
	private _addInListData(
		label: string,
		data: Nullable<ListsData>
	): {
		newListsData: ListsData
		changes: ListsItemChanges[]
	} {
		const newListsData = data ? cloneDeep(data) : []
		const newItem = {
			UUID: uuidV4(),
			label,
			position: data?.length ?? 0,
			items: null,
			updated: this._firebaseSrv.gewNewTimeStamp()
		}

		newListsData.push(newItem)

		return {
			newListsData,
			changes: [{ UUID: newItem.UUID, label, position: newItem.position, crud: 'create' }]
		}
	}

	/**
	 * Delete the list from the f/e data
	 * @param {ListsItemChanges} change
	 * @param {ListsData} data
	 * @return New lists data and changes
	 * @private
	 */
	private _deleteInListData(
		change: ListsItemChanges,
		data: ListsData
	): {
		newListsData: ListsData
		changes: ListsItemChanges[]
	} {
		const newListsData = cloneDeep(data)
		const changes: ListsItemChanges[] = [change]
		const i = newListsData.findIndex((list) => list.UUID === change.UUID)

		if (i !== -1) {
			newListsData.splice(i, 1)
		}

		// Update all the positions -> following position changes will use this information
		// TODO: Perf start from i and not from the beginning
		newListsData.forEach((list) => {
			if (list.position > change.position) {
				list.position -= 1
				changes.push({
					UUID: list.UUID,
					label: list.label,
					position: list.position,
					crud: 'update'
				})
			}
		})

		return { newListsData, changes }
	}

	/**
	 * Update list's position or / label in f/e data
	 * @param {ListsItemChanges} change
	 * @param {ListsData} data
	 * @return New lists data and changes
	 * @private
	 */
	private _updateInListData(
		change: ListsItemChanges,
		data: ListsData
	): {
		newListsData: ListsData
		changes: ListsItemChanges[]
	} {
		const newListsData = cloneDeep(data)
		const item = newListsData.find((list) => list.UUID === change.UUID)

		if (item) {
			item.label = change.label
		}

		return { newListsData, changes: [change] }
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
	itemClicked($event: ListData) {
		void this._route.navigate([`main`, 'list', $event.UUID], {
			state: {
				label: $event.label
			}
		})
	}

	/**
	 * Drag and drop completed
	 * @description Update the data list order and save all the changes for the items position
	 * @param {CdkDragDrop<ListsData>} $event
	 */
	listsDrop($event: CdkDragDrop<ListsData>) {
		const ld = this.listsData() as ListsData
		const cI = $event.currentIndex
		const pI = $event.previousIndex

		// Update the list order
		if (ld) {
			moveItemInArray(ld, pI, cI)
		}

		// Start depends on sort order and could be the original or the new position
		const start = cI < pI ? cI : pI

		// Register all the new position into the _itemsChanges list
		for (let i = start; i < ld.length; i++) {
			const list = ld[i]
			list.position = i
			this._itemsChanges.set([
				{
					UUID: list.UUID,
					label: list.label,
					position: i,
					crud: 'update'
				}
			])
		}

		this.listsData.set(ld)
	}

	/**
	 * Open dialog for new list
	 * @description On confirm true add the new list in f/e data and update _itemsChanges
	 */
	openCreateNew() {
		const dr = this._dialog.open(ListsNewDialogComponent)

		dr.afterClosed().subscribe((result) => {
			if (result) {
				const { changes, newListsData } = this._addInListData(result, this.listsData())
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
				? this._updateInListData($event, this.listsData() as ListsData)
				: this._deleteInListData($event, this.listsData() as ListsData)
		this.listsData.set(newListsData)
		this._itemsChanges.set(changes)
	}

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
}

export default ListsComponent
