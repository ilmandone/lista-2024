import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-list',
	standalone: true,
	imports: [CommonModule, ButtonModule],
	templateUrl: './list.component.html',
	styleUrl: './list.component.scss',
})
export class ListComponent {
	@Input() editMode!: boolean;
	@Input() label!: string;
	@Input() updated!: Date;
}
