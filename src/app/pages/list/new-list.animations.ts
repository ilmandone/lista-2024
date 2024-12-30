import { animate, style, transition, trigger } from '@angular/animations'

export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0, height: 0 }),
    animate('444ms ease-in-out', style({ opacity: 1, height: '*' }))
  ]),
  transition(':leave', [
    style({ opacity: 1, height: '*' }),
    animate('444ms ease-in-out', style({ opacity: 0, height: '0' }))
  ])
])
