import {Routes} from '@angular/router';
import { authGuard } from './guards/auth.guard';
import {loginGuard} from "./guards/login.guard";
import { listResolver } from './pages/list/list.resolver'

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component'),
    canActivate: [loginGuard]
  },
  {
    path: 'main',
    loadComponent: () => import('./pages/main/main.component'),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/lists/lists.component'),
        canActivate: [authGuard],
      },
      {
        path: 'list/:id',
        loadComponent: () => import('./pages/list/list.component'),
        canActivate: [authGuard],
        resolve: {
          label: listResolver
        }
      },
    ] 
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups.component'),
    canActivate: [authGuard]
  },
  {
    path: 'forgot',
    loadComponent: () => import('./pages/forgot-psw/forgot-psw.component'),
    canActivate: [loginGuard]
  },
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full',
  }
];
