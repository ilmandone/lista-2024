import {Component, inject, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from 'primeng/ripple';
import {FirebaseAuthentication} from '../../services/firebase/authe.service';
import {DbService} from 'app/services/firebase/db.service';
import {SidebarModule} from "primeng/sidebar";
import {SideMenuAction, SideMenuComponent} from "../../components/side-menu/side-menu.component";

@Component({
	selector: 'app-home.page',
	standalone: true,
	imports: [ButtonModule, RippleModule, RouterModule, SideMenuComponent],
	templateUrl: './home.page.component.html',
	styleUrl: './home.page.component.scss',
})
export class HomePageComponent implements OnInit {
	private _authSrv = inject(FirebaseAuthentication);
	private _dbSrv = inject(DbService);

	mainMenuOpen = false

	ngOnInit() {
		/*this._dbSrv.init();
		this._dbSrv.loadLists();*/
	}

	sideMenuAction($event: SideMenuAction) {
		switch($event) {
			case 'logout':
				this._authSrv.logout()
				break
		}
	}
}
