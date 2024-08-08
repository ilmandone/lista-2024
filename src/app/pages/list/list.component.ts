import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'
import { MatIcon } from '@angular/material/icon'
import { MatIconButton } from '@angular/material/button'
import { ItemData, ItemsChanges, ItemsData } from '../../data/firebase.interfaces'
import { LoaderComponent } from '../../components/loader/loader.component'
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet'
import {
	IListBottomSheetData,
	ListBottomSheetComponent
} from './list.bottom-sheet/list.bottom-sheet.component'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { ListItemComponent, NotToBuyChange } from './list.item/list.item.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { ListNewDialogComponent } from './list.new.dialog/list.new.dialog.component'
import { ListItemSelectedEvent } from './list.item/list.item.interface'
import { cloneDeep } from 'lodash'
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { MainStateService } from '../../shared/main-state.service'
import { DeleteConfirmDialogComponent } from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'
import { addItem, deleteItem, updateItemAttr, updateItemPosition } from './list.cud'

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
		MatDialogModule,
		CdkDrag,
		CdkDropList,
		CdkDragPlaceholder
	],
	templateUrl: './list.component.html',
	styleUrl: './list.component.scss'
})
class ListComponent implements OnInit {
	private readonly _activatedRoute = inject(ActivatedRoute)
	private readonly _bottomSheet = inject(MatBottomSheet)
	private readonly _dialog = inject(MatDialog)
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _mainStateSrv = inject(MainStateService)
	private _UUID!: string
	private _itemsDataCache: ItemData[] = []
	private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()

	editing = false
	itemsData = signal<ItemData[]>([])
	label!: string
	notToBuyItems = new Set<string>()
	selectedItems = new Set<string>()
	shopping = false
	viewModeGrid = false

	async ngOnInit() {
		this._UUID = this._activatedRoute.snapshot.params['id']
		this.label = this._activatedRoute.snapshot.params['label']

		this._firebaseSrv.loadList(this._UUID).then((r) => {
			this.itemsData.set(r)
		})
	}

	//#region Editing

	/**
	 * Update items
	 * @description Save items in db and reset all the edit information
	 */
	_saveItems() {
		this._mainStateSrv.showLoader()
		this._firebaseSrv.updateList(this._itemsChanges.values, this._UUID).then((r) => {
			this.itemsData.set(r)

			this.selectedItems.clear()
			this._itemsChanges.clear()
			this._itemsDataCache = []

			this._mainStateSrv.hideLoader()
			this.editing = false
		})
	}

	/**
	 * Add an item
	 * @description If another item is selected the new one is added after it
	 * @param {string} label
	 */
	addItem(label: string) {
		const selectedUUID =
			this.selectedItems.size > 0 ? this.selectedItems.values().next().value : null
		const insertAfter = selectedUUID
			? this.itemsData().find((e) => e.UUID === selectedUUID)?.position ??
				this.itemsData().length - 1
			: this.itemsData().length - 1

		const { itemsData, changes } = addItem(label, this.itemsData() as ItemsData, insertAfter)

		this.itemsData.set(itemsData)
		this._itemsChanges.set(changes)

		this.selectedItems.clear()
	}

	/**
	 * Delete button click
	 */
	itemsDeleted() {
		const { itemsData, changes } = deleteItem([...this.selectedItems], this.itemsData())
		this.itemsData.set(itemsData)
		this._itemsChanges.set(changes)
	}

	/**
	 * Item attribute changed
	 * @param $event
	 */
	itemChanged($event: ItemsChanges) {
		const { itemsData, changes } = updateItemAttr($event, this.itemsData())
		this.itemsData.set(itemsData)
		this._itemsChanges.set(changes)
	}

	/**
	 * On item drop update the order
	 * @param $event
	 */
	itemDrop($event: CdkDragDrop<ItemsData>) {
		const { itemsData, changes } = updateItemPosition($event, this.itemsData())

		this.itemsData.set(itemsData)
		this._itemsChanges.set(changes)
	}

	/**
	 * Add or remove and item from the selectedItems set
	 * @param {ListItemSelectedEvent} $event
	 */
	itemSelected($event: ListItemSelectedEvent) {
		if ($event.isSelected) this.selectedItems.add($event.UUID)
		else this.selectedItems.delete($event.UUID)
	}

	/**
	 * Open the new item dialog
	 * @description On confirm the item is added to f/e data
	 */
	openNewItemDialog() {
		const d = this._dialog.open(ListNewDialogComponent)

		d.afterClosed().subscribe((r: string) => {
			if (r) {
				this.addItem(r)
			}
		})
	}

	//#endregion

	//#region Bottom sheet

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

	//#region Interaction
	itemNotToBuyChanged($event: NotToBuyChange) {
		if ($event.notToBuy) this.notToBuyItems.add($event.UUID)
		else this.notToBuyItems.delete($event.UUID)
		console.log(
			'🚀 @@@ ~ file: list.component.ts:195 ~ ListComponent ~ itemNotToBuyChanged ~ this.notToBuyItems:',
			this.notToBuyItems
		)
	}

	//#endregion

	//#region Confirm / Cancel

	/**
	 * Confirm shopping or editing mode
	 */
	confirm() {
		if (this.shopping) {
			console.log('TODO: Remove the in cart value from all items and set toBuy to false')

			this.shopping = false
		} else {
			if (this._itemsChanges.hasDeletedItems) {
				const dr = this._dialog.open(DeleteConfirmDialogComponent)
				dr.afterClosed().subscribe((result) => {
					if (result) this._saveItems()
				})
			} else this._saveItems()
		}
	}

	/**
	 * Cancel pressed in shopping or editing mode
	 * @description Cancel shopping will remove all the in cart status from items. Cancel editing
	 * will restore the cached data
	 */
	cancel() {
		if (this.shopping) {
			this.shopping = false
		} else {
			this.itemsData.set(this._itemsDataCache)

			this.selectedItems.clear()
			this._itemsChanges.clear()
			this._itemsDataCache = []

			this.editing = false
		}
	}

	//#endregion
}

export default ListComponent
