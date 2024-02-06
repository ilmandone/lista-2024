import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from 'app/services/_common/local-storage.service';
import { FirebaseAuthentication } from 'app/services/firebase/authe.service';

export const autheGuard: CanActivateFn = (
	actualRoute: ActivatedRouteSnapshot,
) => {
	const _authSrv = inject(FirebaseAuthentication);
	const _localStorageSrv = inject(LocalStorageService);

	const _router = inject(Router);
	const localData = _localStorageSrv.get('authe');

	const page = actualRoute.url[0].path;

	if (page === 'login') {
		if (_authSrv.isLoggedIn || localData) _router.navigate(['/']);
	} else {
		if (!(localData || _authSrv.isLoggedIn)) _router.navigate(['login']);
	}

	return true;
};
