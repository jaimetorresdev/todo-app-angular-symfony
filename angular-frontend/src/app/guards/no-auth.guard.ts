import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../shared/services/auth-store';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Guard para rutas públicas (landing, login, register).
 * Si el usuario ya tiene sesión activa, lo redirige a su página de inicio.
 */
export const noAuthGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  const token = store.token();

  if (token && !isTokenExpired(token)) {
    return router.createUrlTree(['/']);
  }

  // Sin sesión válida: permitir acceso a la ruta pública
  return true;
};
