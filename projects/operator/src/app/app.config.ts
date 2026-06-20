import {
  ApplicationConfig,
  inject,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { PwaUpdateService } from './core/pwa-update.service';
import {
  APP_BRAND,
  BRAND,
  environment,
  errorInterceptor,
  HealthPollerService,
  LookupInitializerFacade,
  provideDefaultClient,
  SseService,
  SSE_PROVIDER,
  TIME_TRAVEL_STORE_TOKEN,
  TimeTravelStore,
} from '@bikerental/shared';

interface EnvWithBrand {
  brand?: string;
}

const envBrand = (environment as EnvWithBrand).brand ?? BRAND;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAppInitializer(() => {
      inject(HealthPollerService);
      inject(PwaUpdateService).init();
      registerLocaleData(localeRu, 'ru');
      const lookupFacade = inject(LookupInitializerFacade);
      lookupFacade
        .init({
          loadEquipmentStatus: true,
          loadEquipmentType: true,
          loadPricingType: true,
          loadSpecialTariffId: true,
        })
        .subscribe();
      return Promise.resolve();
    }),
    { provide: LOCALE_ID, useValue: environment.defaultLocale },
    { provide: APP_BRAND, useValue: envBrand },
    provideDefaultClient({ basePath: environment.apiUrl }),
    {
      provide: TIME_TRAVEL_STORE_TOKEN,
      useFactory: () => {
        return environment.timeTravelEnabled ? new TimeTravelStore() : null;
      },
    },
    { provide: SSE_PROVIDER, useClass: SseService },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
