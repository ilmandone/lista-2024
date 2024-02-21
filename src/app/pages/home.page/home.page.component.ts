import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
	DialogNewAction,
	DialogNewActionType,
	DialogNewComponent,
} from 'app/components/dialog-new/dialog-new.component';
import { ListComponent } from 'app/components/list/list.component';
import {
	DbService,
	IListData,
	IListsData,
} from 'app/services/firebase/db.service';
import { Command } from 'app/utils/command';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { PaginatorModule } from 'primeng/paginator';
import { RippleModule } from 'primeng/ripple';
import { Subscription } from 'rxjs';
import { LoaderComponent } from '../../components/loader/loader.component';
import {
	SideMenuAction,
	SideMenuComponent,
} from '../../components/side-menu/side-menu.component';
import {
	F_ACTIONS,
	F_VISIBILITY,
	FooterActionsService,
} from '../../services/_common/footer-actions.service';
import { LoadingService } from '../../services/_common/loading.service';
import { FirebaseAuthentication } from '../../services/firebase/authe.service';
import { Nullable } from '../../utils/commons';

@Component({
	selector: 'app-home.page',
	standalone: true,
	imports: [
		CommonModule,
		ButtonModule,
		RippleModule,
		RouterModule,
		SideMenuComponent,
		LoaderComponent,
		ListComponent,
		DialogNewComponent,
		InputTextModule,
		PaginatorModule,
		ReactiveFormsModule,
		MenuModule,
	],
	templateUrl: './home.page.component.html',
	styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _confSrv = inject(ConfirmationService);
	private _dbSrv = inject(DbService);
	private _fASrv = inject(FooterActionsService);
	private _loadingSrv = inject(LoadingService);
	private _messageSrv = inject(MessageService);
	private _router = inject(Router);

	private _command!: Command;

	public lists$!: Subscription;
	public listData!: IListsData;

	// Edit mode
	// private _editActions:<list: IListDat undo: (data:IListData) => void>[] = [];
	public editMode = false;

	// Side menu
	public sideMenuItems!: MenuItem[];

	// Header and menu
	public showFullHeader: boolean = false;
	public mainMenuOpen = false;

	// New list
	public showNewListDialog = false;
	public newListFC!: FormControl<Nullable<string>>;
	public newListFG!: FormGroup<{
		newList: FormControl<Nullable<string>>;
	}>;

	constructor() {
		effect(
			() => {
				const action = this._fASrv.action();

				switch (action) {
					case F_ACTIONS.CANCEL:
						this.listData = this._dbSrv.cachedData;
						this.editMode = false;
						this._resetEditMode();
						break;
					case F_ACTIONS.CONFIRM:
						this.editMode = false;
						this._loadingSrv.visible.set(true);
						this._dbSrv
							.crudOnLists(this._command.getCommands())
							.subscribe((r) => {
								this._onNewData(r);
							});
						this._resetEditMode();
						break;
					case F_ACTIONS.UNDO:
						this._command.undo();
						break;
					case F_ACTIONS.REDO:
						this._command.redo();
						break;
				}
			},
			{ allowSignalWrites: true },
		);

		this._command = new Command();
	}

	//#region Side Menu
	/**
	 * Side menu actions
	 * @param $event
	 */
	sideMenuAction($event: SideMenuAction) {
		switch ($event) {
			case 'logout':
				this._loadingSrv.visible.set(true);
				this._authSrv
					.logout()
					.then(() => {
						void this._router.navigate(['login']);
						this._loadingSrv.visible.set(false);
					})
					.catch(() => {
						this._loadingSrv.visible.set(false);
					});
				break;
		}
	}

	//#endregion

	//#region Privates

	private _onNewData(r: IListsData) {
		r.data = r.data.sort((a, b) => {
			return a.position < b.position ? -1 : 1;
		});
		this.listData = r;
		this._loadingSrv.visible.set(false);
		this.showFullHeader = r.data.length > 0;
	}

	//#endregion

	//#region New list
	/**
	 * Create a new list
	 * @param {Nullable<string>} name
	 * @private
	 */
	private _createNewList(name: Nullable<string>): void {
		if (!name) return;

		const newList: IListData = {
			UUID: this._dbSrv.getUUID(),
			items: [],
			label: name,
			position: this.listData.data.length + 1,
			updated: new Date(),
		};

		this._command.execute(
			'set',
			(newList) => {
				this.listData.data.push(newList as IListData);
			},
			() => {
				this.listData.data.pop();
			},
			newList,
		);

		if (
			this._fASrv.visible === F_VISIBILITY.CANCEL ||
			this._fASrv.visible === null
		)
			this._fASrv.visible = F_VISIBILITY.CONFIRM_CANCEL;
	}

	/**
	 * Handle new list fg submit action
	 */
	submitNewList() {
		this.showNewListDialog = false;
		this._createNewList(this.newListFC.value);
	}

	/**
	 * Handle dialog actions
	 * @param {DialogNewAction} $event
	 */
	public newItemDialogAction($event: DialogNewAction) {
		switch ($event) {
			case DialogNewActionType.SHOW:
				this.newListFC.reset();
				break;

			case DialogNewActionType.OK:
				this._createNewList(this.newListFC.value);
				break;
		}
	}

	//#endregion

	//#region Delete item

	/**
	 * Delete and item with command for redo / undo
	 * @param {IListData} list
	 */
	deleteItem(list: IListData) {
		// NON VA BENE:
		// Deve cancellare l'elemento all'interno di una determinata posizione e aggiornare gli indici successivi
		this._command.execute(
			'delete',
			(list) => {
				const ls = list as IListData;
				const lIndex = this.listData.data.findIndex(
					(l) => l.UUID === ls.UUID,
				);
				this.listData.data.splice(lIndex, 1);
			},
			(list) => {
				const l = list as IListData;
				this.listData.data.splice(l.position, 0, l);
			},
			list,
		);

		if (this._fASrv.visible === F_VISIBILITY.CANCEL)
			this._fASrv.visible = F_VISIBILITY.CONFIRM_CANCEL;
	}

	//#endregion

	//#region Edit mode

	/**
	 * Reset al the info for editMode
	 * @private
	 */
	private _resetEditMode() {
		this._command.reset();
	}

	/**
	 * Enable editing
	 */
	enableEditing(): void {
		this.editMode = true;
		this._fASrv.visible = F_VISIBILITY.CANCEL;
	}

	//#end region

	ngOnInit() {
		this._dbSrv.init();

		// Autoload all the lists
		this._loadingSrv.visible.set(true);
		this.lists$ = this._dbSrv.loadLists().subscribe((r) => {
			this._onNewData(r);
		});

		// Create the new list form control
		this.newListFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required],
		});
		this.newListFG = new FormGroup({ newList: this.newListFC });
	}
}
