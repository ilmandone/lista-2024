import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet'
import { MatIconButton } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIcon } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { ItemComponent } from 'app/components/item/item.component'
import { ItemSelectedEvent } from 'app/components/item/item.interface'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { cloneDeep } from 'lodash'
import { Subject, takeUntil } from 'rxjs'
import { ButtonToggleComponent } from '../../components/button-toggle/button-toggle.component'
import { ConfirmCancelComponent } from '../../components/confirm-cancel/confirm-cancel.component'
import { LoaderComponent } from '../../components/loader/loader.component'
import {
  GroupData,
  ItemsChanges,
  ItemsData,
  ItemsDataWithGroup
} from '../../data/firebase.interfaces'
import { FirebaseService } from '../../data/firebase.service'
import {
  DeleteConfirmDialogComponent
} from '../../shared/delete.confirm.dialog/delete.confirm.dialog.component'
import { MainStateService } from '../../shared/main-state.service'
import {
  ListBottomSheetComponent,
  ListBottomSheetData
} from './list.bottom-sheet/list.bottom-sheet.component'
import { addItem, deleteItem, updateItemAttr, updateItemPosition } from './list.cud'
import { ListNewDialogComponent } from './list.new.dialog/list.new.dialog.component'
import {
  ListGroupsBottomSheetComponent
} from './list.groups.bottom-sheet/list.groups.bottom-sheet.component'
import { DEFAULT_GROUP } from 'app/data/firebase.defaults'
import { gridToListView, listToGridView } from './list.groups-view'
import { MatTooltip } from '@angular/material/tooltip'
import { checkMobile } from 'app/shared/detect.mobile'
import { animate, style, transition, trigger } from '@angular/animations'

@Component({
	selector: 'app-list',
	standalone: true,
	imports: [
		ButtonToggleComponent,
		CdkDrag,
		CdkDragPlaceholder,
		CdkDropList,
		ConfirmCancelComponent,
		ItemComponent,
		LoaderComponent,
		MatBottomSheetModule,
		MatDialogModule,
		MatIcon,
		MatIconButton,
		MatTooltip
	],
	templateUrl: './list.component.html',
	styleUrl: './list.component.scss',
  animations: [
    trigger(
      'inOutAnimation',
      [
        transition(
          ':enter',
          [
            style({ height: 0, opacity: 0 }),
            animate('0.4s ease-out',
              style({ height: '*', opacity: 1 }))
          ]
        ),
        transition(
          ':leave',
          [
            style({ height: '*', opacity: 1 }),
            animate('0.25s ease-in',
              style({ height: 0, opacity: 0 }))
          ]
        )
      ]
    )
  ]
})
class ListComponent implements OnInit, OnDestroy {
	private readonly AUTOSAVE_TIME_OUT = 1200

	private readonly _activatedRoute = inject(ActivatedRoute)
	private readonly _bottomSheet = inject(MatBottomSheet)
	private readonly _dialog = inject(MatDialog)
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _mainStateSrv = inject(MainStateService)
	private _UUID!: string
  private _escKeyDisabled = false
	private _itemsChanges = new SetOfItemsChanges<ItemsChanges>()
	private _itemsDataCache: ItemsDataWithGroup = []
	private _autoSaveTimeOutID!: number
	private _inCartItems = new Set<number>()

	private _destroyed$ = new Subject<boolean>()

	editing = false
	groups = signal<Record<string, GroupData>>({})
  isMobile = checkMobile()
	itemsData = signal<ItemsDataWithGroup>([])
	label!: string
	selectedItems = new Set<string>()
	showByGroups = false
	shopping = false

	async ngOnInit() {
		this._UUID = this._activatedRoute.snapshot.params['id']
		this.label = this._activatedRoute.snapshot.data['label']
		this.groups.set(await this._loadGroups())

		await this._loadData(false)

		this._mainStateSrv.reload$.pipe(takeUntil(this._destroyed$)).subscribe(async () => {
			await this._loadData()
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
	@HostListener('window:keyup', ['$event']) onKeyPress($event: KeyboardEvent) {
		if (this.isMobile) return

    $event.preventDefault()
		const k = $event.key.toLowerCase()

		if (k === 'escape' && !this._escKeyDisabled) {
			this.cancel()
		}

		if (!$event.shiftKey || !$event.altKey) return

		if (this.editing) {
			switch (k) {
				case 'a':
          if (!this._escKeyDisabled) this.openNewItemDialog()
					break
				case 'd':
					if (this.selectedItems.size > 0 && this.selectedItems.size !== this.itemsData().length) {
						this.itemsDeleted()
					}
					break
        case 'enter':
          this.confirm()
          break
				default:
					console.warn('Unknown shortcut key', k)
			}
		} else if (!this.editing) {
			switch (k) {
				case 'e':
					this.openMainBottomSheet()
					break
			}
		}
	}

	/**
	 * Loads the groups data from the Firebase service and returns a promise that resolves to a record
	 * mapping group UUIDs to GroupData objects.
	 *
	 * @param {boolean} useCache - Whether to use the cache or load the groups data from the Firebase service.
	 * @return {Promise<Record<string, GroupData>>} A promise that resolves to a record mapping group UUIDs to GroupData objects.
	 */
	private async _loadGroups(useCache = false): Promise<Record<string, GroupData>> {
		const g = await this._firebaseSrv.loadGroups(useCache)
		return g.reduce((acc: Record<string, GroupData>, val) => {
			acc[val.UUID] = val
			return acc
		}, {})
	}

	/**
	 * Load groups and items data
	 * @description Items with missing group UUID are updated to default group value
	 * @param {boolean} showLoader
	 */
	async _loadData(showLoader = true) {
		if (showLoader) this._mainStateSrv.showLoader()
		this.groups.set(await this._loadGroups())

		this._firebaseSrv.loadList(this._UUID).then((items) => {
			const { data, itemsToDefault } = this._itemsWithGroupData(this.groups(), items)
			this.itemsData.set(data)

			// Fix missing items groups values
			if (itemsToDefault.length > 0) {
				this._itemsChanges.set(itemsToDefault)
				this._saveItems()
			}

			if (showLoader) this._mainStateSrv.hideLoader()
		})
	}

	//#region Editing

	/**
	 * Handle autosave for not to buy data update
	 */
	_engageSaveItems() {
		if (this._autoSaveTimeOutID) clearTimeout(this._autoSaveTimeOutID)
		this._autoSaveTimeOutID = window.setTimeout(this._saveItems.bind(this), this.AUTOSAVE_TIME_OUT)
	}

	/**
	 * Creates an array of item data with group information.
	 *
	 * @param {GroupsData} groups - The collection of group data.
	 * @param {ItemsData} items - The collection of item data.
	 * @return {ItemDataWithGroup[]} An array of item data with group information.
	 */
	private _itemsWithGroupData(
		groups: Record<string, GroupData>,
		items: ItemsData
	): {
		data: ItemsDataWithGroup
		itemsToDefault: ItemsChanges[]
	} {
		const itemsToDefault: ItemsChanges[] = []

		const data = items.map((item) => {
			const groupData = groups[item.group]
			// Add group data to original item data
			if (groupData) {
				return { ...item, groupData }
			}
			// The item doesn't have a valid group UUID -> Set default value
			else {
				itemsToDefault.push({
					...item,
					group: DEFAULT_GROUP.UUID,
					crud: 'update'
				})
				return { ...item, group: DEFAULT_GROUP.UUID, groupData: DEFAULT_GROUP }
			}
		})

		return { data, itemsToDefault }
	}

	/**
	 * Update items
	 * @description Save items in db and reset all the edit information
	 */
	async _saveItems() {
		this._mainStateSrv.showLoader()
		this.groups.set(await this._loadGroups(true))

		this._firebaseSrv.updateList(this._itemsChanges.values, this._UUID).then((r) => {
			const dataWithGroup = this._itemsWithGroupData(this.groups(), r).data
			this.itemsData.set(this.showByGroups ? listToGridView(dataWithGroup) : dataWithGroup)

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
	 * @param {string} groupUUID
	 */
	addItem(label: string, groupUUID: string) {
		const selectedUUID =
			this.selectedItems.size > 0 ? this.selectedItems.values().next().value : null

		const insertAfter = selectedUUID
			? (this.itemsData().find((e) => e.UUID === selectedUUID)?.position ??
				this.itemsData().length - 1)
			: this.itemsData().length - 1

		const groupData = this.groups()[groupUUID]
		const { itemsData, changes } = addItem(label, groupData, this.itemsData(), insertAfter)

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
		this.selectedItems.clear()
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
	 * Item group changed
	 * @description Open bottom sheet to edit the item group
	 * @param {ItemsChanges} $event
	 */
	itemGroupChanged($event: ItemsChanges) {
		this._bottomSheet
			.open(ListGroupsBottomSheetComponent)
			.afterDismissed()
			.subscribe((data: GroupData) => {
				if (data) {
					const { itemsData, changes } = updateItemAttr($event, this.itemsData(), data)
					changes[0].group = data.UUID

					this.itemsData.set(itemsData)
					this._itemsChanges.set(changes)
				}
			})
	}

	/**
	 * Add or remove and item from the selectedItems set
	 * @param {ItemSelectedEvent} $event
	 */
	itemSelected($event: ItemSelectedEvent) {
		if ($event.isSelected) this.selectedItems.add($event.UUID)
		else this.selectedItems.delete($event.UUID)
	}

	/**
	 * Open the new item dialog
	 * @description On confirm the item is added to f/e data
	 */
	openNewItemDialog() {
		this._escKeyDisabled = true
		this._dialog
			.open(ListNewDialogComponent)
			.afterClosed()
			.subscribe((r: { label: string; color: string }) => {
				if (r?.label) {
					this.addItem(r.label, r.color)
				}

				this._escKeyDisabled = false
			})
	}

	//#endregion

	//#region Bottom sheet

	/**
	 * Open the button sheet and subscribe to the dismiss event
	 * @description If editing is enable save items to cache
	 */
	openMainBottomSheet() {
		const p = this._bottomSheet.open(ListBottomSheetComponent, {
			data: {
				showByGroups: this.showByGroups
			} as ListBottomSheetData
		})

		p.afterDismissed().subscribe((r: ListBottomSheetData) => {
			if (!r) return

			Object.assign(this, { ...r })

			if ('showByGroups' in r) {
				if (this.showByGroups) this.itemsData.set(listToGridView(this.itemsData()))
				else this.itemsData.set(gridToListView(this.itemsData()))
			} else if ('editing' in r) {
				this._itemsDataCache = cloneDeep(this.itemsData())
			}
		})
	}

	//#endregion

	//#region Interaction

	/**
	 * Reset in cart state for all in cart items
	 * @description return changes with new items data
	 * @param {ItemsData} data
	 * @param {Set<number>} inCartItems
	 * @private
	 */
	private _resetInCart(
		data: ItemsDataWithGroup,
		inCartItems: Set<number>
	): {
		newItemsData: ItemsDataWithGroup
		changes: ItemsChanges[]
	} {
		const newItemsData = cloneDeep(data)
		const changes: ItemsChanges[] = []

		inCartItems.forEach((index) => {
			const d = newItemsData[index]
			if (d.inCart) {
				d.inCart = false
				changes.push({
					...d,
					crud: 'update'
				})
			}
		})

		return { newItemsData, changes }
	}

	/**
	 * Set items from inCart to notToBuy
	 * @description return changes with new items data
	 * @param {itemsData} data
	 * @param {Set<number>} inCartItems
	 * @private
	 */
	private _fromInCartToNotToBuy(
		data: ItemsDataWithGroup,
		inCartItems: Set<number>
	): {
		newItemsData: ItemsDataWithGroup
		changes: ItemsChanges[]
	} {
		const newItemsData = cloneDeep(data)
		const changes: ItemsChanges[] = []

		inCartItems.forEach((index) => {
			const d = newItemsData[index]
			if (d.inCart) {
				d.notToBuy = true
				d.inCart = false
				changes.push({
					...d,
					crud: 'update'
				})
			}
		})

		return { newItemsData, changes }
	}

	/**
	 * Click on an item
	 * @description Update the item with the $event data for notToBuy and inCart properties
	 * @param {ItemsChanges} $event
	 */
	itemClicked($event: ItemsChanges) {
		if (!this.editing) {
			if (this.shopping) {
				const index = this.itemsData().findIndex((i) => i.UUID === $event.UUID)

				if ($event.inCart) {
					this._inCartItems.add(index)
				} else if (this._inCartItems.has(index)) {
					this._inCartItems.delete(index)
				}
			}

			this.itemChanged($event)
			this._engageSaveItems()
		}
	}

	//#endregion

	//#region Confirm / Cancel

	/**
	 * Confirm shopping or editing mode
	 */
	confirm() {
		if (this.shopping) {
			const { newItemsData, changes } = this._fromInCartToNotToBuy(
				this.itemsData(),
				this._inCartItems
			)
			this._inCartItems.clear()
			this._itemsChanges.set(changes)
			this.itemsData.set(newItemsData)

			this.shopping = false

			this._engageSaveItems()
		} else {
			if (this._itemsChanges.hasDeletedItems) {
				const dr = this._dialog.open(DeleteConfirmDialogComponent)
				dr.afterClosed().subscribe((result) => {
					if (result) void this._saveItems()
				})
			} else void this._saveItems()
		}
	}

	/**
	 * Cancel pressed in shopping or editing mode
	 * @description Cancel shopping will remove all the in cart status from items. Cancel editing
	 * will restore the cached data
	 */
	cancel() {
		if (this.shopping) {
			const { newItemsData, changes } = this._resetInCart(this.itemsData(), this._inCartItems)
			this._inCartItems.clear()
			this._itemsChanges.set(changes)
			this.itemsData.set(newItemsData)

			this.shopping = false
			this._engageSaveItems()
		} else {
			this.itemsData.set(this._itemsDataCache)
			this._itemsDataCache = []
			this.selectedItems.clear()
			this._itemsChanges.clear()

			this.editing = false
		}
	}

	//#endregion
}

export default ListComponent
