import { Location } from '@angular/common'
import { Component, effect, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { FocusInputService } from 'app/components/focus-input/focus-input.service'
import { LoaderComponent } from 'app/components/loader/loader.component'
import { GroupsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { MainStateService } from 'app/shared/main-state.service'

@Component({
	selector: 'app-groups',
	standalone: true,
	imports: [MatIconModule, MatButtonModule, LoaderComponent],
	templateUrl: './groups.component.html',
	styleUrl: './groups.component.scss'
})
class GroupsComponent implements OnInit {
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _focusSrv = inject(FocusInputService)
	private readonly _location = inject(Location)
	private readonly _mainStateSrv = inject(MainStateService)

	selectedGroups = new Set<string>()
	disabled = false

	groups = signal<GroupsData>([])

	constructor() {
		effect(() => {
			this.disabled = this._focusSrv.id() !== null
		})
	}

	async ngOnInit() {
		this.groups.set(await this._firebaseSrv.loadGroups())
	}

	goBack() {
		this._location.back()
	}
}

export default GroupsComponent
