# Task 001: Extend `TariffStore` with `specialTariffId` Signal and `resolveSpecialTariff()` Method

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 3 (Store Implementation): extend a root-scoped signal store with a new cached signal and an Observable-returning resolution method that reads from an injected lookup store.

## 1. Objective

Add a `_specialTariffId` writable signal, a `specialTariffId` public computed signal, and a `resolveSpecialTariff()` method to the existing `TariffStore`. The method reads the list of equipment types from `EquipmentTypeStore`, finds the first type where `isForSpecialTariff = true`, calls `TariffsService.getActiveTariffs(slug)`, and stores the ID of the first returned `SPECIAL`-pricing-type tariff. `RentalStore` (FR-02 Task 003) reads this signal to build cost and activation requests.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/tariff.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

No new Angular/RxJS imports are needed — `EMPTY`, `Observable`, `catchError`, `map`, `tap`, `TariffsService`, `EquipmentTypeStore`, `PricingTypeStore`, `computed`, `inject`, `Injectable`, and `signal` are all already present in the file. However, `TariffMapper` must be confirmed as already imported (it is — the file imports it on the existing import line). No additional import lines are required.

**Code to Add/Replace:**

* **Location:** Inside the `TariffStore` class body.

**Step A — Add the private signal after the `_totalItems` line and add the public computed after `totalItems`.**

Find this block in the file (lines ~21–30):

```typescript
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(10);
  private readonly _totalItems = signal(0);

  readonly tariffs = computed(() => this._tariffs());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());
  readonly currentPage = computed(() => this._currentPage());
  readonly pageSize = computed(() => this._pageSize());
  readonly totalItems = computed(() => this._totalItems());
```

Replace it with:

```typescript
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(10);
  private readonly _totalItems = signal(0);
  private readonly _specialTariffId = signal<number | null>(null);

  readonly tariffs = computed(() => this._tariffs());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());
  readonly currentPage = computed(() => this._currentPage());
  readonly pageSize = computed(() => this._pageSize());
  readonly totalItems = computed(() => this._totalItems());
  readonly specialTariffId = computed(() => this._specialTariffId());
```

**Step B — Add the `resolveSpecialTariff()` method at the end of the class, before the closing `}`.**

Find the closing `}` of the last existing method (the `update` method ends the class). Append the new method directly before the class-closing `}`:

```typescript
  resolveSpecialTariff(): Observable<void> {
    const specialType = this.equipmentTypeStore.types().find((t) => t.isForSpecialTariff);
    if (!specialType) {
      return EMPTY;
    }
    const equipmentTypes = this.equipmentTypeStore.types();
    const pricingTypes = this.pricingTypeStore.pricingTypes();
    return this.service.getActiveTariffs(specialType.slug).pipe(
      tap((responses) => {
        const specialTariff = responses
          .map((r) => TariffMapper.fromResponse(r, equipmentTypes, pricingTypes))
          .find((t) => t.isSpecial);
        this._specialTariffId.set(specialTariff?.id ?? null);
      }),
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
npm test -- --project=shared --run
```
