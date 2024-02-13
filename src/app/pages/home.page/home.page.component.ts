import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ListComponent } from 'app/components/list/list.component';
import { DbService, IListsData } from 'app/services/firebase/db.service';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { catchError, map, Observable, of, Subscription, tap } from 'rxjs';
import { LoaderComponent } from '../../components/loader/loader.component';
import {
	SideMenuAction,
	SideMenuComponent,
} from '../../components/side-menu/side-menu.component';
import { FirebaseAuthentication } from '../../services/firebase/authe.service';
import {
	DialogNewAction,
	DialogNewActionType,
	DialogNewComponent,
} from 'app/components/dialog-new/dialog-new.component';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { MAIN_TOAST_KEY, Nullable } from '../../utils/commons';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { LoadingService } from '../../services/_common/loading.service';
import {
	F_ACTIONS,
	F_VISIBILITY,
	FooterActionsService,
} from '../../services/_common/footer-actions.service';

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
	private _dbSrv = inject(DbService);
	private _router = inject(Router);
	private _messageSrv = inject(MessageService);
	private _loadingSrv = inject(LoadingService);
	private _fASrv = inject(FooterActionsService);

	public lists$!: Subscription;
	public listData!: IListsData;

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
		effect(() => {
			const action = this._fASrv.action();

			if (this.editMode) {
				switch (action) {
					case F_ACTIONS.CANCEL:
						this.editMode = false;
						break;
					case F_ACTIONS.CONFIRM:
						console.log('UPDATE THE LISTS INFO');
						break;
				}
			}
		});
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

	//#region New list
	/**
	 * Create a new list
	 * @param {Nullable<string>} name
	 * @private
	 */
	private _createNewList(name: Nullable<string>): void {
		const newListName = name;

		// Check that newListName have a valid string
		if (newListName && newListName.trim().length > 0)
			this._dbSrv.createList(newListName).subscribe({
				next: (r) => {
					this.listData = r;
				},
				error: (e) => {
					this._messageSrv.add({
						key: MAIN_TOAST_KEY,
						severity: 'warn',
						summary: 'Nuova lista',
						detail: e.msg,
						sticky: true,
						life: 2000,
					});
				},
			});
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
	public newListDialogAction($event: DialogNewAction) {
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

	//#region Edit mode

	enableEditing(): void {
		this.editMode = true;
		this._fASrv.visible = F_VISIBILITY.CANCEL;
	}

	//#endregion

	ngOnInit() {
		this._dbSrv.init();

		// Autoload all the lists
		this._loadingSrv.visible.set(true);
		this.lists$ = this._dbSrv.loadLists().subscribe((r) => {
			this.showFullHeader = r.data.length > 0;
			this._loadingSrv.visible.set(false);
			this.listData = r;
		});

		// Create the new list form control
		this.newListFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required],
		});
		this.newListFG = new FormGroup({ newList: this.newListFC });
	}
}
