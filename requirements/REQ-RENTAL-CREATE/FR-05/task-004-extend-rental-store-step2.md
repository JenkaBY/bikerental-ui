# Task 004: Extend `RentalStore` with Step-2 State

> **Applied Skill:** `angular-signals` — Signal-based state for all step-2 fields. New writable signals are private; public accessors are `computed()`. `canProceedFromStep2` is a derived signal. `refreshCustomerBalance()` re-fetches the customer's available balance via `FinanceService`.

> **⚠️ Prerequisites:**
> - `RentalStore` must already exist at `projects/shared/src/core/state/rental.store.ts` (created by FR-02/FR-03 tasks).
> - It must already have: `customer: Signal<Customer | null>`, `costEstimate: Signal<Money | null>`, `isSaving: Signal<boolean>`.
> - `EquipmentSearchItem` model must exist (task-002).

## 1. Objective

Add the step-2 rental parameters state to `RentalStore`: duration, equipment items, pricing mode, and derived computed signals used by the sticky cost footer and the "Next" button.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### 3a. Add new imports at the top of the file

**Location:** In the existing import block, add these imports alongside the existing ones.

```typescript
import { FinanceService } from '../api/generated';
import { BalanceMapper } from '../mappers/balance.mapper';
import type { EquipmentSearchItem, Money } from '@ui-models';
import { catchError, EMPTY, tap } from 'rxjs';
```

> If these are already imported (e.g., `FinanceService`, `catchError`, `EMPTY`, `tap`), skip the duplicates.

### 3b. Add private state signals

**Location:** After the last existing `private readonly _is...` signal (e.g., `_isLoading`), add:

```typescript
  private readonly
_customerBalance = signal<Money | null>(null);
private readonly
_durationMinutes = signal<number>(60);
private readonly
_equipmentItems = signal<EquipmentSearchItem[]>([]);
private readonly
_specialPriceEnabled = signal<boolean>(false);
private readonly
_discountPercent = signal<number | null>(null);
private readonly
_specialPrice = signal<number | null>(null);
```

### 3c. Add public computed signals

**Location:** After the last existing `readonly` computed (e.g., `readonly isLoading`), add:

```typescript
  readonly
durationMinutes = computed(() => this._durationMinutes());
readonly
equipmentItems = computed(() => this._equipmentItems());
readonly
specialPriceEnabled = computed(() => this._specialPriceEnabled());
readonly
discountPercent = computed(() => this._discountPercent());
readonly
specialPrice = computed(() => this._specialPrice());

readonly
projectedBalance = computed<Money | null>(() => {
  const balance = this._customerBalance();
  const cost = this.costEstimate();
  if (balance === null || cost === null) return null;
  return { amount: balance.amount - cost.amount, currency: balance.currency };
});

readonly
isBalanceSufficient = computed(() => (this.projectedBalance()?.amount ?? -1) >= 0);

readonly
canProceedFromStep2 = computed(() => {
  const hasEquipment = this._equipmentItems().length > 0;
  const specialEnabled = this._specialPriceEnabled();
  const specialFilled = !specialEnabled || (this._specialPrice() !== null && this._specialPrice()! > 0);
  return hasEquipment && specialFilled && this.isBalanceSufficient();
});
```

> **Note:** `costEstimate` is expected to already exist in the store from FR-02. If it does not, define `readonly costEstimate = signal<Money | null>(null)` as a placeholder and replace it once FR-02 is merged.

### 3d. Add the FinanceService injection

**Location:** Add after the last existing `private readonly ... = inject(...)` statement.

```typescript
  private readonly
financeService = inject(FinanceService);
```

### 3e. Add setter methods

**Location:** After the existing `reset()` method, add:

```typescript
  setDurationMinutes(n
:
number
):
void {
  this._durationMinutes.set(n);
}

addEquipmentItem(item
:
EquipmentSearchItem
):
void {
  if(this._equipmentItems().some((e) => e.id === item.id)
)
return;
this._equipmentItems.update((items) => [...items, item]);
}

removeEquipmentItem(id
:
number
):
void {
  this._equipmentItems.update((items) => items.filter((e) => e.id !== id));
}

setDiscountPercent(v
:
number | null
):
void {
  this._discountPercent.set(v);
}

setSpecialPriceEnabled(enabled
:
boolean
):
void {
  this._specialPriceEnabled.set(enabled);
  if(!
enabled
)
{
  this._specialPrice.set(null);
}
}

setSpecialPrice(v
:
number | null
):
void {
  this._specialPrice.set(v);
}

refreshCustomerBalance()
:
void {
  const id = this.customer()?.id;
  if(!
id
)
return;
this.financeService
  .getBalances(id)
  .pipe(
    tap((r) => {
      const balance = BalanceMapper.fromBalanceResponse(r);
      this._customerBalance.set(balance.available);
    }),
    catchError(() => EMPTY),
  )
  .subscribe();
}
```

### 3f. Extend `reset()` to clear step-2 state

**Location:** Inside the existing `reset()` method, add these lines at the end of the method body:

```typescript
    this._customerBalance.set(null);
this._durationMinutes.set(60);
this._equipmentItems.set([]);
this._specialPriceEnabled.set(false);
this._discountPercent.set(null);
this._specialPrice.set(null);
```

## 4. Validation Steps

```bash
npx ng build shared --configuration=development
```
