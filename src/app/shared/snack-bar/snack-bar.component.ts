import { Component, HostBinding, Input, OnInit, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { ISnackBar } from './snack-bar.interface';

@Component({
  selector: 'app-snack-bar',
  standalone: true,
  imports: [],
  templateUrl: './snack-bar.component.html',
  styleUrl: './snack-bar.component.scss',
})
export class SnackBarComponent implements OnInit {
  snackBarData: ISnackBar = inject(MAT_SNACK_BAR_DATA);

  @HostBinding('class')
  containerClass!: string;

  ngOnInit(): void {
    this.containerClass = 'snack-bar--' + this.snackBarData.severity;
  }
}
