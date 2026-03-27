import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../shared/services/auth-store';
import { ToastService } from '../shared/services/toast-service';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (store.isLoggedIn()) {
    return true;
  }

  toast.info('Inicia sesión para continuar');
  return router.createUrlTree(['/login']);
};