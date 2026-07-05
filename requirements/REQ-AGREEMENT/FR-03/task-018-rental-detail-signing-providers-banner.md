# Task 018: Rental Detail — providers + awaiting-signature banner

> **Applied Skills:** `angular-di` (`providers: [AgreementSigningStore, SigningFlowService]` added
> to `RentalDetailComponent` so both the action buttons child and any future signing dialogs opened
> from this route share one instance, per FR-03 design section 3, bullet 11's final paragraph),
> `angular-component` (new banner block styled like the existing overdue/debt banners, same
> pattern: `bg-*-50 border-b border-*-200` strip) — implements FR-03 design section 3, bullet 12.

## 1. Objective

Provide `AgreementSigningStore` and `SigningFlowService` on `RentalDetailComponent` and add a
purple "awaiting signature" info banner analogous to the existing overdue/debt banners.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DurationPipe,
  Labels,
  mapRentalStatus,
  MoneyPipe,
  RENTAL_STORE_TOKEN,
  RentalStore,
  TopUpDialogComponent,
  WithdrawDialogComponent,
  AgreementSigningStore,
} from '@bikerental/shared';
import { SigningFlowService } from '../rental-signing/signing-flow.service';
```

**Code to Add/Replace:**

### 3.1 Extended import line + new relative import

* **Location:** Replace the existing `@bikerental/shared` import block (the multi-line import
  ending `} from '@bikerental/shared';`) with the block shown above, and add the new
  `SigningFlowService` import line immediately after it, before the existing
  `import { RentalCustomerPanelComponent } from ...` line.

### 3.2 `providers` array

* **Location:** Inside the `@Component({...})` decorator, the existing `providers: [...]` array.
* **Snippet:**

```typescript
  providers: [
    RentalStore,
    CustomerFinanceStore,
    BatchRentalPropertyStore,
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
    AgreementSigningStore,
    SigningFlowService,
  ],
```

### 3.3 Awaiting-signature banner

* **Location:** Immediately after the closing `}` of the existing
  `@if (store.isDebt()) { ... }` banner block, before `@if (store.isLoading()) { ... }`.
* **Snippet:**

```typescript
      @if (store.isDebt()) {
        <div
          class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm shrink-0"
        >
          <mat-icon class="!text-base">warning_amber</mat-icon>
          <span>
            @if (store.debtAmount(); as debt) {
              {{ debt | money }}&nbsp;&middot;&nbsp;
            }
            {{ Labels.DebtAutoCharge }}
          </span>
        </div>
      }

      @if (store.isAwaitingSignature()) {
        <div
          class="bg-purple-50 border-b border-purple-200 px-4 py-2 flex items-center gap-2 text-purple-700 text-sm shrink-0"
        >
          <mat-icon class="!text-base">draw</mat-icon>
          <span>{{ Labels.AwaitingSignatureBanner }}</span>
        </div>
      }
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build operator --configuration development
npx ng lint operator
```
