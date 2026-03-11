import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { provideRouter } from '@angular/router';
import { MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { HealthPollerService } from './core/health/health-poller.service';
import { environment } from '../environments/environment';
import { APP_BRAND, BRAND } from './app.tokens';

interface EnvWithBrand {
  brand?: string;
}
const envBrand = (environment as EnvWithBrand).brand ?? BRAND;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    importProvidersFrom(MatNativeDateModule),
    provideAppInitializer(() => {
      inject(HealthPollerService);
      // Register Russian locale data (used when LOCALE_ID === 'ru')
      registerLocaleData(localeRu, 'ru');
    }),
    { provide: LOCALE_ID, useValue: environment.defaultLocale },
    { provide: APP_BRAND, useValue: envBrand },
  ],
};
