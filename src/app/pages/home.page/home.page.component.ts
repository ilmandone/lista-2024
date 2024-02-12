import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ListComponent } from 'app/components/list/list.component';
import { DbService, IListsData } from 'app/services/firebase/db.service';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { catchError, Observable, of, tap } from 'rxjs';
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

	public lists$!: Observable<IListsData>;
	public loading = false;

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

	//#region Side Menu
	/**
	 * Side menu actions
	 * @param $event
	 */
	sideMenuAction($event: SideMenuAction) {
		switch ($event) {
			case 'logout':
				this.loading = true;
				this._authSrv
					.logout()
					.then(() => {
						void this._router.navigate(['login']);
						this.loading = false;
					})
					.catch(() => {
						this.loading = false;
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
			this.lists$ = this._dbSrv.createList(newListName).pipe(
				catchError((r) => {
					this._messageSrv.add({
						key: MAIN_TOAST_KEY,
						severity: 'warn',
						summary: 'Nuova lista',
						detail: r.msg,
						sticky: true,
						life: 2000,
					});
					return of(r);
				}),
			);
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

	ngOnInit() {
		this._dbSrv.init();

		// Autoload all the lists
		this.loading = true;
		this.lists$ = this._dbSrv.loadLists().pipe(
			tap((r) => {
				this.showFullHeader = r.data.length > 0;
				this.loading = false;
			}),
		);

		// Create the new list form control
		this.newListFC = new FormControl<Nullable<string>>(null, {
			validators: [Validators.required],
		});
		this.newListFG = new FormGroup({ newList: this.newListFC });

		// Side menu
		/* this.sideMenuItems = [
			{
				label: 'Le tue liste',
				items: [
					{
						label: 'Aggiungi',
						icon: 'pi pi-plus',
						command: () => {
							this.showNewListDialog = true;
						},
					},
					{
						label: 'Modifica',
						icon: 'pi pi-pencil',
						command: () => {
							console.log('start edit mode');
						},
					},
				],
			},
		]; */
	}
}
