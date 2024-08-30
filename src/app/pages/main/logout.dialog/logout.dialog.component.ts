import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-logout.dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './logout.dialog.component.html',
  styleUrl: './logout.dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoutDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LogoutDialogComponent>);
}
