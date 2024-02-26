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
	ICommandAction,
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
import { MAIN_TOAST_KEY, Nullable } from '../../utils/commons';
import { cloneDeep } from 'lodash';

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
	private _renamingList!: IListData;

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
	public showDialog = false;
	public dialogMode!: 'new' | 'rename';
	public dialogInputFC!: FormControl<Nullable<string>>;
	public dialogHiddenFC!: FormControl<Nullable<IListData>>;
	public dialogFG!: FormGroup<{
		newList: FormControl<Nullable<string>>;
		renameList: FormControl<Nullable<IListData>>;
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
							.crudOnLists(
								this._command.getCommands(),
								this.listData,
							)
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

	private _createDialogFG() {
		this.dialogInputFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required],
		});
		this.dialogHiddenFC = new FormControl<Nullable<IListData>>(null);

		this.dialogFG = new FormGroup({
			newList: this.dialogInputFC,
			renameList: this.dialogHiddenFC,
		});
	}

	private _onNewData(r: IListsData) {
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

		if (this.listData.data.some((list) => list.label === name)) {
			this._messageSrv.add({
				key: MAIN_TOAST_KEY,
				severity: 'warn',
				summary: 'Attenzione',
				detail: 'Questa lista esiste già',
			});
			return;
		}

		const list: IListData = {
			UUID: this._dbSrv.getUUID(),
			items: [],
			label: name,
			position: this.listData.data.length + 1,
			updated: new Date(),
		};

		this._command.execute(
			'set',
			(data) => {
				this.listData.data.push((data as ICommandAction).list);
			},
			() => {
				this.listData.data.pop();
			},
			{ list },
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
	submitDialogForm() {
		if (this.dialogMode === 'new')
			this._createNewList(this.dialogInputFC.value);
		else if (this.dialogHiddenFC.value && this.dialogInputFC.value)
			this.renameList(
				this.dialogHiddenFC.value,
				this.dialogInputFC.value,
			);

		this.showDialog = false;
	}

	//#endregion

	//#region Rename

	showDialogForRename(list: IListData) {
		this.showDialog = true;
		this.dialogMode = 'rename';
		this.dialogHiddenFC.setValue(list);
		this.dialogInputFC.setValue(list.label);
	}

	renameList(list: IListData, newLabel: string) {
		const originalLabel = list.label;

		this._command.execute(
			'update',
			(data) => {
				const index = this.listData.data.findIndex(
					(l) => l.UUID === (data as ICommandAction).list.UUID,
				);
				const newList = cloneDeep(this.listData.data[index]);
				newList.label = (data as ICommandAction).newLabel as string;
				this.listData.data[index] = newList;
			},
			(data) => {
				const index = this.listData.data.findIndex(
					(l) => l.UUID === (data as ICommandAction).list.UUID,
				);
				const newList = cloneDeep(this.listData.data[index]);
				newList.label = (data as ICommandAction)
					.originalLabel as string;
				this.listData.data[index] = newList;
			},
			{ list, newLabel, originalLabel },
		);

		this._fASrv.visible = F_VISIBILITY.CONFIRM_CANCEL;
	}

	//#endregion

	//#region Delete item

	/**
	 * Delete and item with command for redo / undo
	 * @param {IListData} list
	 */
	deleteItem(list: IListData) {
		this._command.execute(
			'delete',
			(data) => {
				const ls = (data as ICommandAction).list;
				const lIndex = this.listData.data.findIndex(
					(l) => l.UUID === ls.UUID,
				);

				if (lIndex !== undefined) {
					for (
						let i = lIndex + 1;
						i < this.listData.data.length;
						i++
					) {
						this.listData.data[i].position--;
					}

					this.listData.data.splice(lIndex, 1);
				} else {
					throw new Error('ERROR: No list item find in datalist');
				}
			},
			(data) => {
				const l = (data as ICommandAction).list;
				const lIndex = l.position;

				if (lIndex !== undefined) {
					this.listData.data.splice(lIndex, 0, l);

					for (let i = lIndex; i < this.listData.data.length; i++) {
						this.listData.data[i].position++;
					}
				} else {
					throw new Error('ERROR: No list item find in datalist');
				}
			},
			{ list },
		);

		if (this._fASrv.visible === F_VISIBILITY.CANCEL)
			this._fASrv.visible = F_VISIBILITY.CONFIRM_CANCEL;
	}

	//#endregion

	//#region Edit mode

	/**
	 * Handle dialog actions
	 * @param {DialogNewAction} $event
	 */
	public dialogAction($event: DialogNewAction) {
		switch ($event) {
			case DialogNewActionType.SHOW:
				if (this.dialogMode === 'new') this.dialogInputFC.reset();
				break;

			case DialogNewActionType.OK:
				if (this.dialogMode === 'new')
					this._createNewList(this.dialogInputFC.value);
				else if (this.dialogHiddenFC.value && this.dialogInputFC.value)
					this.renameList(
						this.dialogHiddenFC.value,
						this.dialogInputFC.value,
					);
				break;
		}
	}

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

	gotoList(UUID: string) {
		return false;
	}

	ngOnInit() {
		this._dbSrv.init();

		// Autoload all the lists
		this._loadingSrv.visible.set(true);
		this.lists$ = this._dbSrv.loadLists().subscribe((r) => {
			this._onNewData(r);
		});

		this._createDialogFG();
	}
}
