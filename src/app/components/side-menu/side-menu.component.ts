import {
	Component,
	EventEmitter,
	Injector,
	Input,
	OnInit,
	Output,
	effect,
	inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Theme, ThemeService } from 'app/services/_common/theme.service';
import { ButtonModule } from 'primeng/button';
import { InputSwitchChangeEvent, InputSwitchModule } from 'primeng/inputswitch';
import { SidebarModule } from 'primeng/sidebar';

export type SideMenuAction = 'logout' | 'reload' | 'groups';

@Component({
	selector: 'app-side-menu',
	standalone: true,
	imports: [
		SidebarModule,
		ButtonModule,
		InputSwitchModule,
		ReactiveFormsModule,
	],
	templateUrl: './side-menu.component.html',
	styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent implements OnInit {
	@Input() visible!: boolean;
	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() action = new EventEmitter<SideMenuAction>();

	private _themeSrv = inject(ThemeService);
	private _injector = inject(Injector);

	checkedFC = new FormControl(false);

	/**
	 * A description of the entire function.
	 *
	 * @param {InputSwitchChangeEvent} e - the switch input event
	 * @return {void}
	 */
	changeTheme(e: InputSwitchChangeEvent) {
		this._themeSrv.setTheme(e.checked ? Theme.DARK : Theme.LIGHT);
	}

	ngOnInit(): void {
		effect(
			() => {
				this.checkedFC.patchValue(
					this._themeSrv.theme() === Theme.DARK,
				);
			},
			{ injector: this._injector },
		);
	}
}
