import { animate, style, transition, trigger } from '@angular/animations'

export const revealHor = trigger(
  'revealHor',
  [
    transition(
      ':enter',
      [
        style({ width: 0,  opacity: 0, padding: 0, margin: 0 }),
        animate('0.3s ease-in-out',
          style({ width: '*', opacity: 1, padding: '*', margin: '*' }))
      ]
    ),
    transition(
      ':leave',
      [
        style({ width: '*',  opacity: 1, padding: '*', margin: '*' }),
        animate('0.3s ease-in-out',
          style({ width: 0, opacity: 0, padding: 0, margin: 0 }))
      ]
    )
  ]
)
