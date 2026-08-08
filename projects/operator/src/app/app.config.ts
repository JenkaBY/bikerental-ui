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
import { firstValueFrom, tap } from 'rxjs';
import { routes } from './app.routes';
import { PwaUpdateService } from './core/pwa-update.service';
import {
  acceptLanguageInterceptor,
  apiAuthInterceptor,
  APP_BRAND,
  AuthService,
  BRAND,
  environment,
  errorInterceptor,
  HealthPollerService,
  LookupInitializerFacade,
  provideDefaultClient,
  provideOidcAuth,
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
    provideHttpClient(
      withInterceptors([acceptLanguageInterceptor, apiAuthInterceptor, errorInterceptor]),
    ),
    provideOidcAuth('bike-rental-operator'),
    provideAppInitializer(() => {
      inject(HealthPollerService);
      inject(PwaUpdateService).init();
      registerLocaleData(localeRu, 'ru');
      const auth = inject(AuthService);
      const lookupFacade = inject(LookupInitializerFacade);
      return firstValueFrom(
        auth.checkAuth().pipe(
          tap((result) => {
            if (result.isAuthenticated) {
              lookupFacade
                .init({
                  loadEquipmentType: true,
                  loadPricingType: true,
                  loadSpecialTariffId: true,
                })
                .subscribe();
            }
          }),
        ),
      ).then(() => undefined);
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
