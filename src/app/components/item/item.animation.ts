import { animate, style, transition, trigger } from '@angular/animations'

export const revealHor = trigger(
  'revealHor',
  [
    transition(
      ':enter',
      [
        style({ width: 0,  opacity: 0, padding: 0 }),
        animate('0.3s ease-in',
          style({ width: '*', opacity: 1, padding: '*' }))
      ]
    ),
    transition(
      ':leave',
      [
        style({ width: '*',  opacity: 1, padding: '*' }),
        animate('0.3s',
          style({ width: 0, opacity: 0, padding: 0 }))
      ]
    )
  ]
)