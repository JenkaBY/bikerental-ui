import { InjectionToken } from '@angular/core';

/** Application-wide brand constant */
export const BRAND = 'Bike Rental';

/** Injection token to provide the application brand via DI */
export const APP_BRAND = new InjectionToken<string>('APP_BRAND');
