import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../shared/services/auth-store';
import { ToastService } from '../shared/services/toast-service';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = store.token();

  if (token && !isTokenExpired(token)) {
    return true;
  }

  if (token) {
    store.clearSession();
    toast.info('Tu sesión ha expirado, inicia sesión de nuevo');
  } else {
    toast.info('Inicia sesión para continuar');
  }

  return router.createUrlTree(['/login']);
};