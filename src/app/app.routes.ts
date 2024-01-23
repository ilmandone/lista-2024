import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page/login.page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home.page/home.page.component').then(m => m.HomePageComponent)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: "full"
  }
];
