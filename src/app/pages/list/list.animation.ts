import { animate, style, transition, trigger } from '@angular/animations'

export const inOutAnimation = trigger(
  'inOutAnimation',
  [
    transition(
      ':enter',
      [
        style({ height: 0, opacity: 0 }),
        animate('0.4s ease-out',
          style({ height: '*', opacity: 1 }))
      ]
    ),
    transition(
      ':leave',
      [
        style({ height: '*', opacity: 1 }),
        animate('0.25s ease-in',
          style({ height: 0, opacity: 0 }))
      ]
    )
  ]
)
