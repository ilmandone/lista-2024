import { Directive, HostListener, input, output } from '@angular/core'

@Directive({
  selector: '[appLongPress]',
  standalone: true
})
export class LongPressDirective {

  private readonly LONG_PRESS_TIMEOUT = 1000
  private _longPressTimeoutID: number | null = null

  active = input.required<boolean>({ alias: 'appLongPress' })

  longPress = output<void>()

  /**
   * Clear the long press timeout and set to null
   * @private
   */
  private _clearLongPressTimeoutID() {
    window.clearTimeout(this._longPressTimeoutID!)
    this._longPressTimeoutID = null
  }

  /**
   * Long press pointer down
   * @description On pointer down start tracking press time and emit the event after a delay time
   * @param {PointerEvent} event$
   */
  @HostListener('pointerdown', ['$event'])
  pointerDown(event$: PointerEvent) {
    if (!this.active()) return
    event$.preventDefault();

    if(this._longPressTimeoutID) {
      this._clearLongPressTimeoutID()
    }

    if (this.active())
      this._longPressTimeoutID = window.setTimeout(() => {
        if (this.active()) {
          this.longPress.emit()
          this._longPressTimeoutID = null
        }
      },this.LONG_PRESS_TIMEOUT)
  }

  /**
   * Clear long press pointer up timeout tracking
   * @param {PointerEvent} event$
   */
  @HostListener('pointerup', ['$event'])
  pointerUp(event$: PointerEvent) {
    if (!this.active()) return
    event$.preventDefault();

    if(this._longPressTimeoutID) {
      this._clearLongPressTimeoutID()
    }
  }
}
