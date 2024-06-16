import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from 'app/shared/firebase.service';

export const authGuard: CanActivateFn = (route, state) => {
  const fbSrv = inject(FirebaseService);
  const router = inject(Router);

  if (fbSrv.isLogged().state === false && router.url !== '/login') {
      void router.navigate(['/login']);
    return false;
  }

  return true;
};
