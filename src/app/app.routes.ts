import {Routes} from '@angular/router';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('./pages/login.page/login.page.component').then(
				(m) => m.LoginPageComponent,
			),
	},
	{
		path: 'home',
		loadComponent: () =>
			import('./pages/home.page/home.page.component').then(
				(m) => m.HomePageComponent,
			),
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
			import('./pages/forgot-password.page/forgot-password.page.component').then(
				(m) => m.ForgotPasswordPageComponent,
			),
	},
	{
		path: '',
		redirectTo: '/home',
		pathMatch: 'full',
	},
];
