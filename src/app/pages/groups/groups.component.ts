import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop'
import { Location } from '@angular/common'
import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ConfirmCancelComponent } from 'app/components/confirm-cancel/confirm-cancel.component'
import { FocusInputService } from 'app/components/focus-input/focus-input.service'
import { GroupComponent } from 'app/components/group/group.component'
import { LoaderComponent } from 'app/components/loader/loader.component'
import { GroupData, GroupsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { SetOfItemsChanges } from 'app/data/items.changes'
import { MainStateService } from 'app/shared/main-state.service'
import { updateGroupPosition } from './groups.cud'

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
		MatIconModule
	],
	templateUrl: './groups.component.html',
	styleUrl: './groups.component.scss'
})
class GroupsComponent implements OnInit {
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _focusSrv = inject(FocusInputService)
	private readonly _location = inject(Location)
	private readonly _mainStateSrv = inject(MainStateService)

	private _groupsDataChache: GroupsData = []
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

	private _startEditing() {
		this._groupsDataChache = this.groups()
		this.editing = true;
	}

	//#endregion

	goBack() {
		this._location.back()
	}

	itemDrop($event: CdkDragDrop<GroupData>) {
		this._startEditing()
		const { changes, groupsData } = updateGroupPosition($event, this.groups())

		this.groups.set(groupsData)
		this._groupChanges.set(changes)
	}

	//#region Confirm / Cancel

	confirm() {
		console.log('confirm');
		
	}
	cancel() {
		this.groups.set(this._groupsDataChache)
		this._groupsDataChache = []
		
		this.editing = false
		
	}

	//#endregion
}

export default GroupsComponent
