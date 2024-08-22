import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { Location } from '@angular/common'
import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ConfirmCancelComponent } from 'app/components/confirm-cancel/confirm-cancel.component'
import { FocusInputService } from 'app/components/focus-input/focus-input.service'
import { GroupComponent } from 'app/components/group/group.component'
import { LoaderComponent } from 'app/components/loader/loader.component'
import { GroupChanges, GroupData, GroupNew, GroupsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { MainStateService } from 'app/shared/main-state.service'
import { addGroup, deleteGroup, updateGroupAttr, updateGroupPosition } from './groups.cud'
import { GroupSelected } from 'app/components/group/group.interface'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { GroupsNewDialogComponent } from './groups.new.dialog/groups.new.dialog.component'

@Component({
	selector: 'app-groups',
	standalone: true,
	imports: [
		CdkDrag,
		CdkDragPlaceholder,
		CdkDropList,
		ConfirmCancelComponent,
		GroupComponent,
		LoaderComponent,
		MatButtonModule,
		MatIconModule,
		MatDialogModule
	],
	templateUrl: './groups.component.html',
	styleUrl: './groups.component.scss'
})
class GroupsComponent implements OnInit {
	private readonly _dialog = inject(MatDialog)
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _focusSrv = inject(FocusInputService)
	private readonly _location = inject(Location)
	private readonly _mainStateSrv = inject(MainStateService)

	private _groupsDataCache: GroupsData = []
	private _groupChanges = new SetOfItemsChanges<GroupData>()

	selectedGroups = new Set<string>()
	disabled = false
	editing = false

	groups = signal<GroupsData>([])

	constructor() {
		effect(() => {
			this.disabled = this._focusSrv.id() !== null
		})
	}

	async ngOnInit() {
		this.groups.set(await this._firebaseSrv.loadGroups())
	}

	//#region Privates

	private _addGroup(data: GroupNew) {
		const selectedUUID =
			this.selectedGroups.size > 0 ? this.selectedGroups.values().next().value : null
		const insertAfter = selectedUUID
			? this.groups().find((e) => e.UUID === selectedUUID)?.position ?? this.groups().length - 1
			: this.groups().length - 1
		const {changes, groupsData} = addGroup(data, this.groups(), insertAfter)

    this.groups.set(groupsData)
    this._groupChanges.set(changes)

		this.selectedGroups.clear()
	}

	/**
	 * Start edit mode
	 * @description set cache data and start edit mode
	 * @private
	 */
	private _startEditing(): void {
		if (this.editing) return

		this._groupsDataCache = this.groups()
		this.editing = true
	}

	/**
	 * End editing
	 * @description Clear selected and cached data
	 * @private
	 */
	private _endEditing(): void {
		if (!this.editing) return

		this._groupsDataCache = []
		this.selectedGroups.clear()

		this.editing = false
	}

	//#endregion

	//#region Interaction

	/**
	 * Go back
	 */
	goBack() {
		this._location.back()
	}

	/**
	 * Update group attributes
	 * @param {GroupChanges} $event
	 */
	groupChanged($event: GroupChanges) {
		this._startEditing()
		const { groupsData, changes } = updateGroupAttr($event, this.groups())

		this.groups.set(groupsData)
		this._groupChanges.set(changes)
	}

	/**
	 * Delete group(s) and update items positions
	 */
	groupsDeleted() {
		this._startEditing()
		const { changes, groupsData } = deleteGroup([...this.selectedGroups], this.groups())

		this.groups.set(groupsData)
		this._groupChanges.set(changes)
		this.selectedGroups.clear()
	}

	/**
	 * Update group position
	 * @param {CdkDragDrop<GroupData>} $event
	 */
	groupDrop($event: CdkDragDrop<GroupData>) {
		this._startEditing()
		const { changes, groupsData } = updateGroupPosition($event, this.groups())

		this.groups.set(groupsData)
		this._groupChanges.set(changes)
		this.selectedGroups.clear()
	}

	/**
	 * Group selection
	 * @param {GroupSelected} $event
	 */
	groupSelected($event: GroupSelected) {
		if ($event.isSelected) this.selectedGroups.add($event.UUID)
		else this.selectedGroups.delete($event.UUID)
	}

	openNewGroupDialog() {
		const d = this._dialog.open(GroupsNewDialogComponent)
		d.afterClosed().subscribe((r: GroupNew) => {
			if (r) {
        this._startEditing()
				this._addGroup(r)
			}
		})
	}

	//#endregion

	//#region Confirm / Cancel

	confirm() {
		console.log('SAVE MODS TO DB')
		this._endEditing()
	}

	cancel() {
		this.groups.set(this._groupsDataCache)
		this._endEditing()
	}

	//#endregion
}

export default GroupsComponent
