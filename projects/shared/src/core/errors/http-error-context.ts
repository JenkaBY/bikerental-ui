import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SUPPRESS_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

export function suppressErrorNotification(context: HttpContext = new HttpContext()): HttpContext {
  return context.set(SUPPRESS_ERROR_NOTIFICATION, true);
}
