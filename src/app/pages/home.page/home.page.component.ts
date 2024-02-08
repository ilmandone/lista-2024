import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ListComponent } from 'app/components/list/list.component';
import { DbService, IListsData } from 'app/services/firebase/db.service';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Observable, tap } from 'rxjs';
import { LoaderComponent } from '../../components/loader/loader.component';
import {
	SideMenuAction,
	SideMenuComponent,
} from '../../components/side-menu/side-menu.component';
import { FirebaseAuthentication } from '../../services/firebase/authe.service';
import { DialogNewComponent } from 'app/components/dialog-new/dialog-new.component';

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
	],
	templateUrl: './home.page.component.html',
	styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _dbSrv = inject(DbService);
	private _router = inject(Router);

	public lists$!: Observable<IListsData>;

	public loading = false;

	// Header and menu
	public showFullHeader: boolean = false;
	public mainMenuOpen = false;

	// New list
	public showNewListDialog = false;

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
	}

	newList() {
		this.showNewListDialog = true;

		console.log(
			'@@@ ~ HomePageComponent ~ newList ~ this.showNewListDialog:',
			this.showNewListDialog,
		);
	}

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
}
