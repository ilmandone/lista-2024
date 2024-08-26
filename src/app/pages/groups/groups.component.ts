import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { Location } from '@angular/common'
import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { ConfirmCancelComponent } from 'app/components/confirm-cancel/confirm-cancel.component'
import { FocusInputService } from 'app/components/focus-input/focus-input.service'
import { GroupComponent } from 'app/components/group/group.component'
import { GroupSelected } from 'app/components/group/group.interface'
import { LoaderComponent } from 'app/components/loader/loader.component'
import { GroupChanges, GroupData, GroupNew, GroupsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { DeleteConfirmDialogComponent } from 'app/shared/delete.confirm.dialog/delete.confirm.dialog.component'
import { MainStateService } from 'app/shared/main-state.service'
import { addGroup, deleteGroup, updateGroupAttr, updateGroupPosition } from './groups.cud'
import { GroupsNewDialogComponent } from './groups.new.dialog/groups.new.dialog.component'

import { DEFAULT_GROUP } from 'app/data/firebase.defaults'

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

	private readonly DEFAULT_GROUP = DEFAULT_GROUP

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
	focused = false

	groups = signal<GroupsData>([])

	constructor() {
		effect(() => {
			this.disabled = this._focusSrv.id() !== null
		})
	}

	async ngOnInit() {
		this.groups.set(await this._firebaseSrv.loadGroups(false, false))
	}

	//#region Privates

	private _addGroup(data: GroupNew) {
	/**
	 * Adds a new group to the existing groups.
	 *
	 * @param {GroupNew} data - The new group data to be added.
	 * @return {void}
	 */
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
	 * Save groups
	 * @description Saves the groups by updating the groups in the database and
	 * setting the updated groups in the component.
	 *
	 * @private
	 * @return {void}
	 */
	private _saveGroups() {
		this._mainStateSrv.showLoader()
		this._firebaseSrv.updateGroup(this._groupChanges.values).then(r => {
			this.groups.set(r)
			this._endEditing()

			this._mainStateSrv.hideLoader()
		})
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

	/**
	 * Opens a new group dialog and handles the result.
	 *
	 * @return {void}
	 */
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

	/**
	 * Confirm editing changes.
	 * @description If there are deleted items, opens a confirmation dialog.
	 *
	 * @return {void}
	 */
	confirm(): void {
		if(this._groupChanges.hasDeletedItems) {
			const dr = this._dialog.open(DeleteConfirmDialogComponent)
				dr.afterClosed().subscribe((result) => {
					if (result) this._saveGroups()
				})
		} else 
		this._saveGroups()
	}

	/**
	 * Cancels the current editing session.
	 * @description Resets the groups data to its cached state and ends the editing mode.
	 *
	 * @return {void}
	 */
	cancel(): void {
	
		this.groups.set(this._groupsDataCache)
		this._endEditing()
	}

	//#endregion
}

export default GroupsComponent
