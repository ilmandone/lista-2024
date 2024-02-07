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

@Component({
	selector: 'app-home.page',
	standalone: true,
	imports: [
		ButtonModule,
		RippleModule,
		RouterModule,
		SideMenuComponent,
		LoaderComponent,
	],
	templateUrl: './home.page.component.html',
	styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _dbSrv = inject(DbService);
	private _router = inject(Router);

	private _lists!: DocumentsData;

	loading = false;
	mainMenuOpen = false;

	ngOnInit() {
		this._dbSrv.init();
		this._dbSrv.loadLists().subscribe((r) => {
			console.log('@@@ R', r);
		});
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
