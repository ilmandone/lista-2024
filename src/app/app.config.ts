import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {FirebaseService} from "./shared/firebase.service";
import {firstValueFrom, lastValueFrom} from "rxjs";

export function InitApp(fbSrv: FirebaseService) {
  return (): Promise<unknown> =>
    lastValueFrom(fbSrv.start())
}

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideAnimationsAsync(), {
    provide: APP_INITIALIZER,
    useFactory: InitApp,
    deps: [FirebaseService],
    multi: true
  }]
};
