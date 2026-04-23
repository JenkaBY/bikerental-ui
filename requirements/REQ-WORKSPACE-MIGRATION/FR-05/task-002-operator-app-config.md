# Task 002: Create Operator Application Configuration

> **Applied Skill:** `angular-di` — `inject()`, `InjectionToken`, `provideAppInitializer`.
> **Applied Skill:** `angular-http` — `provideHttpClient` with interceptors.

## 1. Objective

Create `projects/operator/src/app/app.config.ts` with all providers required by the operator app: router, HTTP client with error interceptor, locale registration, `provideDefaultClient`, `LookupInitializerFacade` initializer (preloads equipment types, statuses, pricing types needed by the rental-create flow), and `APP_BRAND`.

`MatNativeDateModule` is **not** included — operator has no date pickers in its current feature scope.

## 2. File to Create

* **File Path:** `projects/operator/src/app/app.config.ts`
* **Action:** Create New File

---

## 3. Code Implementation

```typescript
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
  LookupInitializerFacade,
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
      const lookupFacade = inject(LookupInitializerFacade);
      lookupFacade
        .init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: false })
        .subscribe();
      return Promise.resolve();
    }),
    { provide: LOCALE_ID, useValue: environment.defaultLocale },
    { provide: APP_BRAND, useValue: envBrand },
    provideDefaultClient({ basePath: environment.apiUrl }),
  ],
};
```

---

## 4. Validation Steps

```powershell
# TypeScript parse-check — error about missing ./app.routes is expected until Task 003 completes
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: only `Cannot find module './app.routes'` error. No errors for `@bikerental/shared` symbols or `../environments/environment`.
