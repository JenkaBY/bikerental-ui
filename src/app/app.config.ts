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
import { provideDefaultClient } from './core/api/generated';
import { LookupInitializerFacade } from '@store.lookup-initializer.facade';

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
      // load lookup entities in background
      const lookupFacade = inject(LookupInitializerFacade);
      lookupFacade
        .init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: true })
        .subscribe();
      return Promise.resolve();
    }),
    { provide: LOCALE_ID, useValue: environment.defaultLocale },
    { provide: APP_BRAND, useValue: envBrand },
    provideDefaultClient({ basePath: environment.apiUrl }),
  ],
};
