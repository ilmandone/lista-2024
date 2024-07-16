import {Routes} from '@angular/router';
import { authGuard } from './guards/auth.guard';
import {loginGuard} from "./guards/login.guard";

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(c => c.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'main',
    loadComponent: () => import('./pages/main/main.component').then(c => c.MainComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/lists/lists.component').then(c => c.ListsComponent),
        canActivate: [authGuard],
      },
      {
        path: 'list/:id',
        loadComponent: () => import('./pages/list/list.component').then(c => c.ListComponent),
        canActivate: [authGuard],
      },
    ]
  },
  {
    path: 'forgot',
    loadComponent: () => import('./pages/forgot-psw/forgot-psw.component').then(c => c.ForgotPswComponent),
    canActivate: [loginGuard]
  },
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full',
  }
];
