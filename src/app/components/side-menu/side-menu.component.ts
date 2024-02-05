import {
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
	effect,
	inject,
} from '@angular/core';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Theme, ThemeService } from 'app/services/_common/theme.service';

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

	checkedFC = new FormControl(false);

	ngOnInit(): void {
		this.checkedFC.valueChanges.subscribe((r) => {
			this._themeSrv.setTheme(r ? Theme.DARK : Theme.LIGHT);
		});
	}
}
