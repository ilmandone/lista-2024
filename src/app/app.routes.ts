import {Routes} from '@angular/router';
import { authGuard } from './guards/auth.guard';
import {loginGuard} from "./guards/login.guard";
import { newListResolver } from './pages/new-list/new-list.resolver'
import { NewListGroupsService } from './pages/new-list/new-list.groups.service'

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
        loadComponent: () => import('./pages/new-list/new-list.component'),
        canActivate: [authGuard],
        resolve: {
          label: newListResolver
        },
        providers: [
          NewListGroupsService
        ]
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
