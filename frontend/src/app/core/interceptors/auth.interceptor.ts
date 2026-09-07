import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.statusText) {
        errorMessage = `${error.status}: ${error.statusText}`;
      }

      if (error.status === 401 && !req.url.includes('/login')) {
        toastService.error('Session Expired', 'Please log in again to continue.');
        authService.logout();
      } else if (error.status === 403) {
        toastService.error('Access Denied', errorMessage);
      } else if (error.status !== 401) {
        toastService.error('Error', errorMessage);
      }

      return throwError(() => error);
    })
  );
};
