import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import {
  APP_BRAND,
  BRAND,
  errorInterceptor,
  HealthPollerService,
  provideDefaultClient,
} from '@bikerental/shared';
import { environment } from '../environments/environment';

interface EnvWithBrand {
  brand?: string;
}
const envBrand = (environment as EnvWithBrand).brand ?? BRAND;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAppInitializer(() => {
      inject(HealthPollerService);
      registerLocaleData(localeRu, 'ru');
      return Promise.resolve();
    }),
    { provide: LOCALE_ID, useValue: environment.defaultLocale },
    { provide: APP_BRAND, useValue: envBrand },
    provideDefaultClient({ basePath: environment.apiUrl }),
  ],
};
