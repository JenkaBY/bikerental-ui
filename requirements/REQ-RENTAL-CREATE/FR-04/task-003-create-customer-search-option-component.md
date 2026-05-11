# Task 003: Create `CustomerSearchOptionComponent` (Dumb)

> **Applied Skill:** `angular-component` — Dumb/presentational component: `ChangeDetectionStrategy.OnPush`, `input()` signal, no service injections, inline template.

## 1. Objective

Create a standalone dumb component that renders a single customer row inside a `mat-option`. It receives a `Customer` domain model and displays the phone number and full name. This component is imported by `CustomerSearchInputComponent` (Task 005).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/customer-search-option.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Customer } from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Customer } from '@bikerental/shared';

@Component({
  selector: 'app-customer-search-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="font-medium">{{ customer().phone }}</span>
    <span class="ml-2 text-slate-500">{{ customer().firstName }} {{ customer().lastName }}</span>
  `,
})
export class CustomerSearchOptionComponent {
  readonly customer = input.required<Customer>();
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build operator --configuration=development
```
