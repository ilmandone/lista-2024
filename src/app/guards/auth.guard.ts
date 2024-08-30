import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from 'app/data/firebase.service';

export const authGuard: CanActivateFn = () => {
  const fbSrv = inject(FirebaseService);
  const router = inject(Router);

  if (fbSrv.isLogged().state === false && router.url !== '/login') {
      void router.navigate(['/login']);
    return false;
  }

  return true;
};
