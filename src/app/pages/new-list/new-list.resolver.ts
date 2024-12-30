import { RedirectCommand, ResolveFn, Router } from '@angular/router'
import { inject } from '@angular/core'
import { FirebaseService } from '../../data/firebase.service'
import { Nullable } from '../../shared/common.interfaces'

export const newListResolver: ResolveFn<Nullable<string>> = async (route) => {
  const firebaseSrv = inject(FirebaseService)
  const router = inject(Router)
  const UUID = route.paramMap.get('id')

  const gotoMain = ():RedirectCommand =>  {
    return new RedirectCommand(router.parseUrl('/main'))
  }

  return UUID ? await firebaseSrv.getListLabelByUUID(UUID) || gotoMain() : gotoMain()
};
