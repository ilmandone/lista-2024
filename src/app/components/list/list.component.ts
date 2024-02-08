import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-list',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './list.component.html',
	styleUrl: './list.component.scss',
})
export class ListComponent {
	@Input() label!: string;
}
