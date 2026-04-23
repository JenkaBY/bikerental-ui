# Task 002: Create Gateway Application Configuration

> **Applied Skill:** `angular-routing` — `provideRouter` with gateway-specific routes; no `LookupInitializerFacade` initialiser (gateway loads no domain lookups).
> **Applied Skill:** `angular-di` — `inject()` inside `provideAppInitializer`; token providers for `LOCALE_ID` and `APP_BRAND`.

## 1. Objective

Create `projects/gateway/src/app/app.config.ts` — the gateway-specific `ApplicationConfig`. It is trimmed from the monolithic `src/app/app.config.ts`:

- **Keep:** router, HTTP client, error interceptor, locale registration, `HealthPollerService` initialiser, `LOCALE_ID`, `APP_BRAND`, `provideDefaultClient`
- **Remove:** `LookupInitializerFacade` import and its `.init()` call (gateway does not need to pre-load equipment / tariff lookups)
- **Remove:** `MatNativeDateModule` import (no Material date pickers in gateway)

All imports must resolve via `@bikerental/shared` for shared-lib symbols, and relative paths for gateway-local files (`./app.routes`, `../../environments/environment`).

## 2. File to Create

* **File Path:** `projects/gateway/src/app/app.config.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Imports Required:**

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
import { errorInterceptor, HealthPollerService, provideDefaultClient, APP_BRAND, BRAND } from '@bikerental/shared';
import { environment } from '../../environments/environment';
```

> **Note on `BRAND`:** `BRAND` is the default string constant exported from `app.tokens.ts` in the shared library. `APP_BRAND` is the injection token. Both are re-exported from `@bikerental/shared` via `public-api.ts`.

**Code to Add/Replace:**

* **Location:** Entire new file — no existing content to replace.

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
  errorInterceptor,
  HealthPollerService,
  provideDefaultClient,
  APP_BRAND,
  BRAND,
} from '@bikerental/shared';
import { environment } from '../../environments/environment';

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
```

---

## 4. Validation Steps

```powershell
# Confirm file exists
Test-Path "projects\gateway\src\app\app.config.ts"

# TypeScript parse-check (requires task-001 to be complete)
npx tsc -p projects/gateway/tsconfig.app.json --noEmit
```

Expected: `Test-Path` returns `True`; `tsc` produces no errors.
