# Task 005: Register `RentalStore` in `RentalCreateComponent` Providers

> **Applied Skill:** `angular-di` — feature-scoped provider pattern: declare a non-root `@Injectable()` service in the `providers` array of the host component so each route visit creates a fresh, isolated store instance. The component itself is the DI scope boundary.

## 1. Objective

Declare `RentalStore` in `RentalCreateComponent.providers` so that every navigation to `/rentals/new` creates a fresh store instance. Remove the placeholder template so the component is ready to host child step components in subsequent FRs.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/rental-create.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RentalStore } from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Replace the entire file content with the updated version below.

Current file content:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>New Rental</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK011</p>
  `,
})
export class RentalCreateComponent {
}
```

Replace with:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore],
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>New Rental</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK011</p>
  `,
})
export class RentalCreateComponent {
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
npm test -- --project=operator --run
```
