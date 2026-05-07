import { Routes } from '@angular/router';
import { LandingPageComponent } from './modules/landing-page-component/landing-page-component';
import { TasksPageComponent } from './modules/tasks-page-component/tasks-page-component';
import { LoginComponent } from './modules/auth/login-component/login-component';
import { RegisterComponent } from './modules/auth/register-component/register-component';
import { AdminDashboardComponent } from './modules/admin/dashboard-component/dashboard-component';
import { SettingsComponent } from './modules/settings-component/settings-component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'tasks', component: TasksPageComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [noAuthGuard] },
  // Ruta comodín: cualquier URL no reconocida redirige a la página principal
  { path: '**', redirectTo: '' },
];
