# Task 007: Rental Detail — RentalSignatureStore wiring + agreement section

> **Applied Skills:** `angular-di` (`providers: [..., RentalSignatureStore]` added to
> `RentalDetailComponent` so the section and any future signature-related children share one
> instance, mirroring how `AgreementSigningStore`/`SigningFlowService` were added in FR-03
> task-018), `angular-signals` (a SEPARATE `effect()` keyed on `store.status()`/`store.id()` for the
> signature load — kept independent from the existing `loadDetail` effect and the existing
> `isDraft` redirect effect, so each effect has one responsibility) — implements FR-04 design
> section 3, bullet 3 (component wiring) + Interaction Sequence.

## 1. Objective

Provide `RentalSignatureStore` on `RentalDetailComponent`, load the signature summary whenever the
rental's status is `ACTIVE`, `COMPLETED`, or `DEBT`, and render
`<app-rental-agreement-section>` between the cost section and the equipment section when a summary
is present, wiring its `downloadRequested` output to `signatureStore.downloadPdf(rentalId())`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import {
  AgreementSigningStore,
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DurationPipe,
  Labels,
  mapRentalStatus,
  RENTAL_STORE_TOKEN,
  RentalSignatureStore,
  RentalStore,
  TopUpDialogComponent,
  MoneyPipe,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { SigningFlowService } from '../rental-signing/signing-flow.service';
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalActionButtonsComponent } from './rental-action-buttons.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
import { RentalCostSectionComponent } from './rental-cost-section.component';
import { RentalAgreementSectionComponent } from './rental-agreement-section.component';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
```

**Code to Add/Replace:**

### 3.1 `@bikerental/shared` import block + new component import

* **Location:** Replace the existing `@bikerental/shared` multi-line import block (currently ending
  `} from '@bikerental/shared';`) with the block below, and add the new
  `import { RentalAgreementSectionComponent } from './rental-agreement-section.component';` line
  immediately after the existing
  `import { RentalCostSectionComponent } from './rental-cost-section.component';` line, before
  `import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';`.
* **Snippet (full replacement import block, in file order):**

```typescript
import { DatePipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import {
  AgreementSigningStore,
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DurationPipe,
  Labels,
  mapRentalStatus,
  RENTAL_STORE_TOKEN,
  RentalSignatureStore,
  RentalStore,
  TopUpDialogComponent,
  MoneyPipe,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { SigningFlowService } from '../rental-signing/signing-flow.service';
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalActionButtonsComponent } from './rental-action-buttons.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
import { RentalCostSectionComponent } from './rental-cost-section.component';
import { RentalAgreementSectionComponent } from './rental-agreement-section.component';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
```

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
    RentalSignatureStore,
  ],
```

### 3.3 `imports` array

* **Location:** Inside the `@Component({...})` decorator, the existing `imports: [...]` array.
* **Snippet:**

```typescript
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
    RentalActionButtonsComponent,
    RentalPeriodSectionComponent,
    RentalCostSectionComponent,
    RentalAgreementSectionComponent,
    RentalEquipmentSectionComponent,
    MoneyPipe,
    DurationPipe,
  ],
```

### 3.4 Template — agreement section placement

* **Location:** Inside the `@else if (store.id() !== null) { ... }` branch's content div, replace
  the block from `<app-rental-cost-section />` through `<app-rental-equipment-section .../>` with
  the version below (inserts the agreement section, wrapped in `@if (signatureStore.summary(); as
  summary)`, between the cost section's `<mat-divider />` and the equipment section).
* **Snippet:**

```typescript
          <app-rental-cost-section />
          <mat-divider />

          @if (signatureStore.summary(); as summary) {
            <app-rental-agreement-section
              [summary]="summary"
              [isDownloading]="signatureStore.isDownloading()"
              (downloadRequested)="signatureStore.downloadPdf(rentalId())"
            />
            <mat-divider />
          }

          <app-rental-equipment-section
            [equipmentItems]="store.rentalEquipmentItems()"
            [isDebt]="store.isDebt()"
          />
```

### 3.5 Inject the store

* **Location:** Inside the class body, immediately after the existing
  `private readonly viewContainerRef = inject(ViewContainerRef);` line.
* **Snippet:**

```typescript
  protected readonly signatureStore = inject(RentalSignatureStore);
```

### 3.6 Separate effect for signature load

* **Location:** Inside the `constructor()`, immediately after the existing `isDraft` redirect
  effect block (the one starting `effect(() => { if (this.store.isLoading() ...`) and before the
  `selectUid` preselect effect.
* **Snippet:**

```typescript
    effect(() => {
      const status = this.store.status();
      const id = this.store.id();
      if (id === null) return;
      if (status === 'ACTIVE' || status === 'COMPLETED' || status === 'DEBT') {
        this.signatureStore.load(id);
      }
    });
```

**Full resulting `constructor()` for reference (do not diverge):**

```typescript
  constructor() {
    effect(() => {
      const id = this.rentalId();
      if (!isNaN(id) && id > 0) {
        this.store.loadDetail(id);
      }
    });

    effect(() => {
      if (this.store.isLoading() || this.store.loadError() || this.store.id() === null) return;
      if (this.store.isDraft()) {
        void this.router.navigate(['/rentals', this.store.id(), 'edit']);
      }
    });

    effect(() => {
      const status = this.store.status();
      const id = this.store.id();
      if (id === null) return;
      if (status === 'ACTIVE' || status === 'COMPLETED' || status === 'DEBT') {
        this.signatureStore.load(id);
      }
    });

    effect(() => {
      const uid = this.selectUid();
      if (!uid || this.preselectApplied) return;
      if (this.store.isLoading() || this.store.id() === null) return;
      const match = this.store.rentalEquipmentItems().find((item) => item.uid === uid);
      if (match) {
        this.store.selectEquipmentItem(match.id);
        this.preselectApplied = true;
      }
    });
  }
```

**Note on re-fire after signing:** the effect re-reads `store.status()`/`store.id()` on every
change; after FR-03's signing dialog completes, `RentalActionButtonsComponent.onContinueSigning()`
calls `this.store.loadDetail(id)`, which updates `status` to `ACTIVE` — this effect then fires
`signatureStore.load(id)` again automatically, no manual coordination needed.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build operator --configuration development
npx ng lint operator
```
