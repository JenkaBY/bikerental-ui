# Task 006: Update `RentalCreateComponent` — Wire Up the Stepper

> **Applied Skill:** `angular-component`, `angular-routing` — Replace the placeholder template with a signal-based `@switch` stepper that renders the three step components. Add component imports. The existing `activeStep = signal<number>(0)` and `providers: [RentalStore]` are already in place — only the template and `imports` array need changes.

> **⚠️ Prerequisite:** Requires **task-005** (`RentalStep3Component`) to be completed first.

## 1. Objective

Wire `RentalStep1Component`, `RentalStep2Component`, and `RentalStep3Component` into the existing `RentalCreateComponent`. Advancing/retreating between steps is driven by `activeStep` signal emissions from child `output()` events.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/rental-create.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### 3a. Add step component imports after the existing last import

**Location:** After the last `import` statement (currently `import { Labels, RentalStore } from '@bikerental/shared';`).

```typescript
import { RentalStep1Component } from './step1/rental-step1.component';
import { RentalStep2Component } from './step2/rental-step2.component';
import { RentalStep3Component } from './step3/rental-step3.component';
```

### 3b. Replace the `@Component` decorator's template and add `imports` array

**Location:** The entire `@Component({...})` decorator. Replace from `@Component({` through the closing `})` of the decorator (just before `export class`).

**Code to Add/Replace:**

```typescript
@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore],
  imports: [RentalStep1Component, RentalStep2Component, RentalStep3Component],
  template: `
    @if (isLoading()) {
      <div class="flex h-full items-center justify-center">
        <p class="text-slate-500">{{ Labels.Loading }}</p>
      </div>
    } @else {
      @switch (activeStep()) {
        @case (0) {
          <app-rental-step1 (customerSelected)="activeStep.set(1)" />
        }
        @case (1) {
          <app-rental-step2 (stepAdvanced)="activeStep.set(2)" />
        }
        @case (2) {
          <app-rental-step3 (stepBack)="activeStep.set(1)" />
        }
      }
    }
  `,
})
```

> **Note:** The class body (`export class RentalCreateComponent { ... }`) remains completely unchanged.

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
