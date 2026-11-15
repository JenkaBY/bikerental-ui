import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import {
  acceptLanguageInterceptor,
  apiAuthInterceptor,
  APP_BRAND,
  AuthService,
  BRAND,
  environment,
  errorInterceptor,
  HealthPollerService,
  provideDefaultClient,
  provideOidcAuth,
  TIME_TRAVEL_STORE_TOKEN,
} from '@bikerental/shared';

interface EnvWithBrand {
  brand?: string;
}

const envBrand = (environment as EnvWithBrand).brand ?? BRAND;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([acceptLanguageInterceptor, apiAuthInterceptor, errorInterceptor]),
    ),
    provideOidcAuth('bike-rental-platform'),
    provideAppInitializer(() => {
      inject(HealthPollerService);
      registerLocaleData(localeRu, 'ru');
      const auth = inject(AuthService);
      return firstValueFrom(auth.checkAuth()).then(() => undefined);
    }),
    { provide: LOCALE_ID, useValue: environment.defaultLocale },
    { provide: APP_BRAND, useValue: envBrand },
    provideDefaultClient({ basePath: environment.apiUrl }),
    { provide: TIME_TRAVEL_STORE_TOKEN, useValue: null },
  ],
};
