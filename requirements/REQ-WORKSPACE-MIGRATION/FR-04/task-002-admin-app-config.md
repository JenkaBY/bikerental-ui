# Task 002: Create Admin Application Configuration

> **Applied Skill:** `angular-di` — `inject()`, `InjectionToken`, `provideAppInitializer`.
> **Applied Skill:** `angular-http` — `provideHttpClient` with interceptors.

## 1. Objective

Create `projects/admin/src/app/app.config.ts` with all providers required by the admin app: router, HTTP client with error interceptor, locale, `provideDefaultClient`, `LookupInitializerFacade` initializer (preloads equipment types, statuses, pricing types), `MatNativeDateModule` providers (required by date pickers in tariff dialogs), and `APP_BRAND`.

## 2. Files to Create

* **File Path:** `projects/admin/src/app/app.config.ts`
* **Action:** Create New File

---

## 3. Code Implementation

```typescript
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
    importProvidersFrom(MatNativeDateModule),
    provideAppInitializer(() => {
      inject(HealthPollerService);
      registerLocaleData(localeRu, 'ru');
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
```

> **Note:** `LookupInitializerFacade` is exported from `@bikerental/shared` via `public-api.ts`. The `@store.lookup-initializer.facade` tsconfig alias also works but `@bikerental/shared` is preferred for new project files to keep import style uniform.

---

## 4. Validation Steps

```powershell
# TypeScript parse-check — no errors expected after app.routes.ts is created (Task 003)
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: errors about missing `./app.routes` until Task 003 is completed. No errors about `@bikerental/shared` symbols.
