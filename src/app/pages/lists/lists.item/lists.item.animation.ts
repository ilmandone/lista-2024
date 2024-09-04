import { animate, style, transition, trigger } from '@angular/animations'

export const revealHor = trigger(
  'slideFromLeft',
  [
    transition(
      ':enter',
      [
        style({ width: 0,  opacity: 0, padding: 0 }),
        animate('0.2s ease-out',
          style({ width: '*', opacity: 1, padding: '*' }))
      ]
    ),
    transition(
      ':leave',
      [
        style({ width: '*',  opacity: 1, padding: '*' }),
        animate('0.15s ease-in',
          style({ width: 0, opacity: 0, padding: 0 }))
      ]
    )
  ]
)
