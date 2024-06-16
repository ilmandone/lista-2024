import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {FirebaseService} from "../shared/firebase.service";

export const loginGuard: CanActivateFn = (route, state) => {
  const fbSrv = inject(FirebaseService);
  const router = inject(Router);

  if (fbSrv.isLogged().state === true ) {
    void router.navigate(['/']);
    return false;
  }

  return true;
};

