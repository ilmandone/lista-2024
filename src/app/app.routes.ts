import { Routes } from '@angular/router';
import { autheGuard } from './guards/authe.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('./pages/login.page/login.page.component').then(
				(m) => m.LoginPageComponent,
			),
		canActivate: [autheGuard],
	},
	{
		path: 'home',
		loadComponent: () =>
			import('./pages/home.page/home.page.component').then(
				(m) => m.HomePageComponent,
			),
		canActivate: [autheGuard],
	},
	{
		path: 'list',
		loadComponent: () =>
			import('./pages/home.page/home.page.component').then(
				(m) => m.HomePageComponent,
			),
	},
	{
		path: 'forgot-password',
		loadComponent: () =>
			import(
				'./pages/forgot-password.page/forgot-password.page.component'
			).then((m) => m.ForgotPasswordPageComponent),
	},
	{
		path: '',
		redirectTo: '/home',
		pathMatch: 'full',
	},
];
