import { Component, inject, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ListsData } from 'app/data/firebase.interfaces'
import { FirebaseService } from 'app/data/firebase.service'
import { Nullable } from 'app/shared/common.interfaces'
import { ListsEmptyComponent } from './lists.empty/lists.empty.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { NewListsDialogComponent } from './new-lists.dialog/new-lists.dialog.component'
import { ListsItemComponent } from './lists.item/lists.item.component'
import { LoaderComponent } from '../../components/loader/loader.component'

@Component({
	selector: 'app-lists',
	standalone: true,
	imports: [MatIconModule, MatButtonModule, ListsEmptyComponent, MatDialogModule, ListsItemComponent, LoaderComponent],
	templateUrl: './lists.component.html',
	styleUrl: './lists.component.scss'
})
export class ListsComponent implements OnInit {
	private readonly _firebaseSrv = inject(FirebaseService)
	private readonly _dialog = inject(MatDialog)

	listsData = signal<Nullable<ListsData>>(null)
  editModeOn = false

	//#region Interactions

	openCreateNew() {
		const dr = this._dialog.open(NewListsDialogComponent)
		dr.afterClosed().subscribe((result) => {
			console.log('NEW LIST NAME: ', result)
		})
	}

	clickTopButton() {
		if(!this.editModeOn) this.editModeOn = true
    else this.openCreateNew()
	}

	//#endregion

	ngOnInit(): void {
		this._firebaseSrv.startDB()

		this._firebaseSrv.loadLists().then((r) => {
			console.log('🚀 @@@ ~ file: lists.component.ts:24 ~ ListsComponent ~ this._firebaseSrv.loadLists ~ r:', r)
			this.listsData.set(r)
		})
	}
}
