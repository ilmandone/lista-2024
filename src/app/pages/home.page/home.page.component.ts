import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { FirebaseAuthentication } from '../../services/firebase/authe.service';
import { DbService, DocumentsData } from 'app/services/firebase/db.service';
import {
	SideMenuAction,
	SideMenuComponent,
} from '../../components/side-menu/side-menu.component';
import { LoaderComponent } from '../../components/loader/loader.component';
import { Observable, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ListComponent } from 'app/components/list/list.component';

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
	],
	templateUrl: './home.page.component.html',
	styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _dbSrv = inject(DbService);
	private _router = inject(Router);

	public lists$!: Observable<DocumentsData>;

	public loading = false;
	public showFullHeader: boolean = false;
	public mainMenuOpen = false;

	ngOnInit() {
		this._dbSrv.init();

		// Autoload all the lists
		this.loading = true;
		this.lists$ = this._dbSrv.loadLists().pipe(
			/*switchMap(() => {
					return of({data: []})
				}),*/
			tap((r) => {
				this.showFullHeader = r.data.length > 0;
				this.loading = false;
			}),
		);
	}

	newList() {
		console.log('CREATE NEW LIST');
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
