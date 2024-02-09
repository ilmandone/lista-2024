import {CommonModule} from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {ListComponent} from 'app/components/list/list.component';
import {DbService, IListsData} from 'app/services/firebase/db.service';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from 'primeng/ripple';
import {catchError, Observable, of, tap} from 'rxjs';
import {LoaderComponent} from '../../components/loader/loader.component';
import {SideMenuAction, SideMenuComponent,} from '../../components/side-menu/side-menu.component';
import {FirebaseAuthentication} from '../../services/firebase/authe.service';
import {DialogNewAction, DialogNewActionType, DialogNewComponent} from 'app/components/dialog-new/dialog-new.component';
import {InputTextModule} from "primeng/inputtext";
import {PaginatorModule} from "primeng/paginator";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {Nullable} from "../../utils/commons";
import {MessageService} from "primeng/api";
import {ToastModule} from "primeng/toast";

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
		ToastModule
	],
	templateUrl: './home.page.component.html',
	styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _dbSrv = inject(DbService);
	private _router = inject(Router);
	private _messageSrv = inject(MessageService);

	public readonly MAIN_TOAST_KEY = 'main-ts'

	public lists$!: Observable<IListsData>;

	public loading = false;

	// Header and menu
	public showFullHeader: boolean = false;
	public mainMenuOpen = false;

	// New list
	public showNewListDialog = false;
	public newListFC!: FormControl<Nullable<string>>;


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
						this._router.navigate(['login']);
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

	newListDialogAction($event: DialogNewAction) {
		switch ($event) {

			case DialogNewActionType.SHOW:
				this.newListFC.reset()
				break

			// On OK call the create list if the
			case DialogNewActionType.OK:
				const newListName = this.newListFC.value

				// Check that newListName have a valid string
				if (newListName && newListName.trim().length > 0)

					this.lists$ = this._dbSrv.createList(newListName).pipe(
						catchError((r) => {
							this._messageSrv.add({
								key: this.MAIN_TOAST_KEY,
								severity: 'warn',
								summary: 'Nuova lista',
								detail: r.msg,
								sticky: true,
								life: 2000
							})
							console.error('ERROR ON LIST CREATION', r.msg)
							return of(r)
						})
					)
				break
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
		this.newListFC = new FormControl<Nullable<string>>(null, {validators: [Validators.required]})
	}
}
