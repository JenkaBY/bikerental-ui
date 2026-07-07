# Task 014: Add Agreements Nav Item

> **Applied Skill:** `angular-component` (`NavItem` model reuse, no new component) — adds the
> sidebar nav entry per FR-01's design section 3 ("add `NAV_ITEMS` entry (icon `history_edu`,
> label from `Labels`)").

## 1. Objective

Add an "Agreements" entry to `AdminLayoutComponent`'s `NAV_ITEMS` array, using `Labels` for the
label (matching the convention already used for `Tariffs`) and the `history_edu` Material icon.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/layout/admin-layout.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

* **Location:** In the existing `import { APP_BRAND, AuthService, HealthIndicatorComponent,
  LogoutButtonComponent, NavItem, ShellComponent } from '@bikerental/shared';` statement, add
  `Labels` to the named-import list (alphabetically, after `HealthIndicatorComponent` and before
  `LogoutButtonComponent`).

```typescript
import {
  APP_BRAND,
  AuthService,
  HealthIndicatorComponent,
  Labels,
  LogoutButtonComponent,
  NavItem,
  ShellComponent,
} from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Inside the `NAV_ITEMS` array, immediately after the
  `{ label: $localize\`Tariffs\`, route: 'tariffs', icon: 'payments' },` line.
* **Snippet:**

```typescript
  { label: Labels.AgreementsNavLabel, route: 'agreements', icon: 'history_edu' },
```

**Resulting `NAV_ITEMS` (for reference — this task does not need to touch any other entries):**

```typescript
const NAV_ITEMS: NavItem[] = [
  { label: $localize`Equipment`, route: 'equipment', icon: 'pedal_bike' },
  { label: $localize`Equipment Types`, route: 'equipment-types', icon: 'category' },
  // TODO remove completely.
  // { label: $localize`Equipment Statuses`, route: 'equipment-statuses', icon: 'toggle_on' },
  { label: $localize`Tariffs`, route: 'tariffs', icon: 'payments' },
  { label: Labels.AgreementsNavLabel, route: 'agreements', icon: 'history_edu' },
  { label: $localize`Customers`, route: 'customers', icon: 'people' },
  { label: $localize`Rentals`, route: 'rentals', icon: 'receipt_long' },
  { label: $localize`Payments`, route: 'payments', icon: 'account_balance_wallet' },
  { label: $localize`Users`, route: 'users', icon: 'manage_accounts' },
];
```

**Note:** this task depends on Task 007 (`Labels.AgreementsNavLabel` must already exist in
`labels.ts`) — run Task 007 before this one.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
