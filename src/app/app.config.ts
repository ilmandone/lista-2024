import {
  APP_INITIALIZER,
  ApplicationConfig,
  isDevMode,
  provideZoneChangeDetection
} from '@angular/core'
import { provideRouter, withViewTransitions } from '@angular/router'

import { routes } from './app.routes'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { FirebaseService } from './data/firebase.service'
import { provideServiceWorker } from '@angular/service-worker'

export function InitApp(fbSrv: FirebaseService) {
  return (): Promise<void> =>
    fbSrv.start()
}

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: InitApp,
      deps: [FirebaseService],
      multi: true
    }, provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })]
}
