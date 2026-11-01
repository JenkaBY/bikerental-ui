import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { CurrentPointStore } from '../state/current-point.store';

const API_PATH = '/api';
export const POINT_SLUG_HEADER = 'X-Point-Slug';
export const SKIP_POINT_SCOPE = new HttpContextToken<boolean>(() => false);

function isApiRequest(url: string): boolean {
  return url.startsWith(`${environment.apiUrl}${API_PATH}`) || url.startsWith(API_PATH);
}

export const pointInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || req.context.get(SKIP_POINT_SCOPE)) {
    return next(req);
  }
  const pointSlug = inject(CurrentPointStore).currentSlug();
  return pointSlug === null
    ? next(req)
    : next(req.clone({ setHeaders: { [POINT_SLUG_HEADER]: pointSlug } }));
};
