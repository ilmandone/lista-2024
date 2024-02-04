import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SidebarModule} from "primeng/sidebar";
import {ButtonModule} from "primeng/button";

export type SideMenuAction = 'logout' | 'reload' | 'groups'

@Component({
	selector: 'app-side-menu',
	standalone: true,
	imports: [SidebarModule, ButtonModule],
	templateUrl: './side-menu.component.html',
	styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {
	@Input() visible!: boolean
	@Output() visibleChange = new EventEmitter<boolean>()
	@Output() action = new EventEmitter<SideMenuAction>()
}
