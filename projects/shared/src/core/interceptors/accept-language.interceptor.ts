import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { UserStore } from '../state/user.store';

const API_PATH = '/api';

function isApiRequest(url: string): boolean {
  return url.startsWith(`${environment.apiUrl}${API_PATH}`) || url.startsWith(API_PATH);
}

export const acceptLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const language = inject(UserStore).preferences().language;

  return next(req.clone({ setHeaders: { 'Accept-Language': language } }));
};
