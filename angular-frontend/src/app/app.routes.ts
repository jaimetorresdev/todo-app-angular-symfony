import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./modules/landing-page-component/landing-page-component').then(
        m => m.LandingPageComponent
      )
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./modules/tasks-page-component/tasks-page-component').then(
        m => m.TasksPageComponent
      )
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/login-component/login-component').then(
        m => m.LoginComponent
      )
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./modules/auth/register-component/register-component').then(
        m => m.RegisterComponent
      )
  }
];