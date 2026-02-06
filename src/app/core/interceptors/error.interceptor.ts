import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);

  return next(req).pipe(
    catchError(error => {

      if (error.status === 401) {
        tokenService.removeToken();
        tokenService.removeUser();
        router.navigate(['/auth/login']);
      }

      if (error.status === 403) {
        alert('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      }

      return throwError(() => error);
    })
  );
};
