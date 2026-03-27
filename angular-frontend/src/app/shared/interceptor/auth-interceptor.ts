import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../services/auth-store';
import { ToastService } from '../services/toast-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = localStorage.getItem('token');

  if (token && !req.headers.has('Authorization')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        store.clearSession();

        if (router.url !== '/login') {
          toast.error('Tu sesión ha caducado. Inicia sesión de nuevo.');
          router.navigateByUrl('/login');
        }
      }

      return throwError(() => err);
    })
  );
};