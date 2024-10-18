import { Component, effect, input } from '@angular/core'
import { Severity } from '../../shared/common.interfaces'
import { CommonModule } from '@angular/common'


@Component({
  selector: 'app-alert-bar',
  standalone: true,
  imports: [CommonModule],
  styleUrl: 'alert-bar.component.scss',
  template: `
    @if (show) {
      <div
        class="alert-bar"
        [ngClass]="severity().level"
      ></div>
    }
  `
})
export class AlertBarComponent {

  private readonly ALERT_TIMEOUT = 1500

  severity = input.required<{level: Severity | null}>()
  show = false
  showTimeoutID: number | null = null

  constructor() {
    effect(() => {
      if (this.severity().level) {

        if (this.showTimeoutID)
          window.clearTimeout(this.showTimeoutID)

        this.show = true

        this.showTimeoutID = window.setTimeout(() => {
            this._clearTimeout(this.showTimeoutID!)
            this.show = false
          },
          this.ALERT_TIMEOUT)
      }
    })
  }

  private _clearTimeout(id: number) {
    window.clearTimeout(id)
    this.showTimeoutID = null
  }
}
