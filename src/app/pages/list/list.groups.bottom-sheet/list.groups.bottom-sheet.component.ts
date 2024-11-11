import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, signal } from '@angular/core'
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatRipple } from '@angular/material/core'
import { GroupData, GroupsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'

export interface GroupBottomSheetData {
	UUID: string
}

@Component({
	selector: 'app-list-groups-bottom-sheet',
	standalone: true,
	imports: [CommonModule, MatRipple],
	templateUrl: './list.groups.bottom-sheet.component.html',
	styleUrl: './list.groups.bottom-sheet.component.scss'
})
export class ListGroupsBottomSheetComponent implements OnInit {
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _bottomSheetRef = inject(MatBottomSheetRef<ListGroupsBottomSheetComponent>)
	readonly data: GroupBottomSheetData = inject(MAT_BOTTOM_SHEET_DATA)

	groups = signal<GroupsData>([])

	async ngOnInit(): Promise<void> {
		this.groups.set(await this._firebaseSrv.loadGroups(true))
	}

	selectGroup($event: Event, g: GroupData) {
		this._bottomSheetRef.dismiss(g)
		$event.preventDefault()
	}
}
