import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { CurrentPointStore } from '../state/current-point.store';

const API_PATH = '/api';
export const POINT_ID_HEADER = 'X-Point-Id';

function isApiRequest(url: string): boolean {
  return url.startsWith(`${environment.apiUrl}${API_PATH}`) || url.startsWith(API_PATH);
}

export const pointInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const pointId = inject(CurrentPointStore).currentId();

  return pointId === null
    ? next(req)
    : next(req.clone({ setHeaders: { [POINT_ID_HEADER]: pointId } }));
};
