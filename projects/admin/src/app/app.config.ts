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
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';
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
    provideOidcAuth('bike-rental-admin'),
    importProvidersFrom(MatNativeDateModule),
    provideAppInitializer(() => {
      inject(HealthPollerService);
      registerLocaleData(localeRu, 'ru');
      const auth = inject(AuthService);
      const lookupFacade = inject(LookupInitializerFacade);
      return firstValueFrom(
        auth.checkAuth().pipe(
          tap((result) => {
            if (result.isAuthenticated) {
              lookupFacade
                .init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: true })
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
  ],
};
