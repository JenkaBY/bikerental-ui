# Task 002: Add `loadSpecialTariffId` to `LookupConfig` and `LookupInitializerFacade`, then enable it in the Operator App Bootstrap

> **Applied Skill:** `angular-di` — `provideAppInitializer()` non-blocking bootstrap pattern: extend the shared lookup configuration with a new opt-in flag and wire the resolution inside the facade so callers only need to set a boolean.

## 1. Objective

Extend `LookupConfig` with an optional `loadSpecialTariffId` flag (default `false`). Update `LookupInitializerFacade.init()` to call `TariffStore.resolveSpecialTariff()` after the equipment-type task completes when `loadSpecialTariffId` is `true`. Finally, pass `loadSpecialTariffId: true` in the operator `app.config.ts`. No change is needed to `app.config.ts` imports — `TariffStore` is injected only inside the facade.

## 2. Files to Modify

### File A — `LookupConfig` model

* **File Path:** `projects/shared/src/core/models/lookup-config.model.ts`
* **Action:** Modify Existing File

### File B — `LookupInitializerFacade`

* **File Path:** `projects/shared/src/core/state/lookup-initializer.facade.ts`
* **Action:** Modify Existing File

### File C — Operator App Config

* **File Path:** `projects/operator/src/app/app.config.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

---

### File A — Add `loadSpecialTariffId` to `LookupConfig`

**Location:** `projects/shared/src/core/models/lookup-config.model.ts` — add one optional property to the existing interface.

Find:

```typescript
export interface LookupConfig {
  loadEquipmentStatus?: boolean;
  loadEquipmentType?: boolean;
  loadPricingType?: boolean;
}
```

Replace with:

```typescript
export interface LookupConfig {
  loadEquipmentStatus?: boolean;
  loadEquipmentType?: boolean;
  loadPricingType?: boolean;
  loadSpecialTariffId?: boolean;
}
```

---

### File B — Update `LookupInitializerFacade`

**Imports Required:**

Add `TariffStore` to the existing imports block in `projects/shared/src/core/state/lookup-initializer.facade.ts`.

Find:

```typescript
import { EquipmentStatusStore } from './equipment-status.store';
import { EquipmentTypeStore } from './equipment-type.store';
import { PricingTypeStore } from './pricing-type.store';
import { LookupConfig } from '../models/lookup-config.model';
import { UserStore } from '@store.user.store';
```

Replace with:

```typescript
import { EquipmentStatusStore } from './equipment-status.store';
import { EquipmentTypeStore } from './equipment-type.store';
import { PricingTypeStore } from './pricing-type.store';
import { TariffStore } from './tariff.store';
import { LookupConfig } from '../models/lookup-config.model';
import { UserStore } from '@store.user.store';
```

**Code to Add/Replace:**

Add `TariffStore` injection and the `loadSpecialTariffId` branch to `init()`.

* **Location:** Inside the `LookupInitializerFacade` class body.

Find the existing `init(config: LookupConfig)` method in full:

```typescript
  init(config: LookupConfig) {
    console.log('Background initialization started...');
    const tasks = [];
    // TODO Remove after real Auth will be enabled
    this.userStore.login().subscribe();

    if (config.loadEquipmentStatus) {
      tasks.push(
        this.equipmentStatusStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load equipment status', err);
            return of(null);
          }),
        ),
      );
    }

    if (config.loadEquipmentType) {
      tasks.push(
        this.equipmentTypeStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load equipment types', err);
            return of(null);
          }),
        ),
      );
    }

    if (config.loadPricingType) {
      tasks.push(
        this.pricingTypeStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load pricing types', err);
            return of(null);
          }),
        ),
      );
    }

    return forkJoin(tasks).pipe(
      tap(() => console.log('Lookup initialization started...')),
      finalize(() => console.log('Lookup initialization finished.')),
    );
  }
```

Replace with:

```typescript
  private readonly tariffStore = inject(TariffStore);

  init(config: LookupConfig) {
    console.log('Background initialization started...');
    const tasks = [];
    // TODO Remove after real Auth will be enabled
    this.userStore.login().subscribe();

    if (config.loadEquipmentStatus) {
      tasks.push(
        this.equipmentStatusStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load equipment status', err);
            return of(null);
          }),
        ),
      );
    }

    if (config.loadEquipmentType) {
      tasks.push(
        this.equipmentTypeStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load equipment types', err);
            return of(null);
          }),
        ),
      );
    }

    if (config.loadPricingType) {
      tasks.push(
        this.pricingTypeStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load pricing types', err);
            return of(null);
          }),
        ),
      );
    }

    const pipeline = forkJoin(tasks).pipe(
      tap(() => console.log('Lookup initialization started...')),
      finalize(() => console.log('Lookup initialization finished.')),
    );

    if (config.loadSpecialTariffId) {
      return pipeline.pipe(
        switchMap(() => this.tariffStore.resolveSpecialTariff()),
        catchError(() => of(null)),
      );
    }

    return pipeline;
  }
```

**Additional import** — add `switchMap` to the existing RxJS imports at the top of the facade file.

Find:

```typescript
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
```

Replace with:

```typescript
import { catchError, finalize, forkJoin, of, switchMap, tap } from 'rxjs';
```

---

### File C — Pass `loadSpecialTariffId: true` in Operator App Config

No import changes needed in `app.config.ts`.

* **Location:** Inside the `provideAppInitializer` callback in `projects/operator/src/app/app.config.ts`.

Find:

```typescript
      lookupFacade
        .init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: false })
        .subscribe();
```

Replace with:

```typescript
      lookupFacade
        .init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: false, loadSpecialTariffId: true })
        .subscribe();
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
npm test -- --project=shared --run
npm test -- --project=operator --run
```
