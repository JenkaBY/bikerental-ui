# Task 001: Rewrite admin `@store.*` imports to `@bikerental/shared`

> **Applied Skill:** `typescript-es2022` (SKILL.md §"General guardrails" — pure ES modules, single
> canonical module specifier) + the AGENTS.md "Three-Layer Data Pipeline" rule that consuming
> projects import shared symbols only from `@bikerental/shared`. This task enforces FR-04 Scenario 1
> ("every cross-project import uses `@bikerental/shared`").

## 1. Objective

Replace every `@store.*` per-file alias import in the `admin` project with the canonical
`@bikerental/shared` barrel import, merging the moved symbols into the file's existing
`@bikerental/shared` import statement where one is present, so each file ends with exactly one barrel
import line. Pure import-path refactor — no other code, logic, or test assertion changes.

## 2. Files to Modify

All paths are absolute. There are **11 files** (5 production `.ts` + 6 `.spec.ts`). Spec-file edits
are mechanical specifier rewrites only — do **not** touch any test logic, `describe`, `it`, `expect`,
or `vi` calls.

1. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\equipment\equipment-list.component.ts`
2. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\equipment\equipment-dialog.component.ts`
3. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\equipment\equipment-list.component.spec.ts`
4. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\equipment\equipment-dialog.component.spec.ts`
5. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\equipment-types\equipment-type-dialog.component.ts`
6. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\equipment-types\equipment-type-dialog.error.spec.ts`
7. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\tariffs\tariff-list.component.ts`
8. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\tariffs\tariff-list.component.spec.ts`
9. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\tariffs\tariff-dialog.component.ts`
10. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\tariffs\tariff-dialog.component.spec.ts`
11. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\tariffs\tariff-dialog.error.spec.ts`
12. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\customers\customer-detail\customer-detail.component.ts`
13. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\customers\customer-detail\customer-layout.store.ts`
14. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\customers\customer-detail\customer-layout.store.spec.ts`
15. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\customers\customer-detail\tabs\customer-account\customer-account.component.ts`
16. `D:\Workspace\private\bikerental-ui\projects\admin\src\app\customers\customer-detail\tabs\customer-account\customer-account.component.spec.ts`

> Note: the FR text says "11 admin files"; the grounded grep above lists every individual offending
> file. Edit **all** of them. (`equipment-list.component` etc. each carry multiple `@store.*` lines.)
> All target symbols are confirmed exported from `projects/shared/src/public-api.ts` (equipment-status,
> equipment-type, equipment, pricing-type, tariff, customer-finance stores).

- **Action:** Modify Existing Files

## 3. Code Implementation

No new imports are introduced beyond the existing barrel; you are merging symbols into the existing
`@bikerental/shared` import and deleting the `@store.*` lines. Apply each edit **byte-for-byte**.

### File 1 — `equipment-list.component.ts`

Existing barrel line (line 15) and the three `@store.*` lines (17–19):

**OLD:**

```ts
import { Labels, TruncatePipe } from '@bikerental/shared';
import { Equipment } from '@ui-models';
import { EquipmentStore } from '@store.equipment.store';
import { EquipmentTypeStore } from '@store.equipment-type.store';
import { EquipmentStatusStore } from '@store.equipment-status.store';
```

**NEW:**

```ts
import {
  EquipmentStatusStore,
  EquipmentStore,
  EquipmentTypeStore,
  Labels,
  TruncatePipe,
} from '@bikerental/shared';
import { Equipment } from '@ui-models';
```

### File 2 — `equipment-dialog.component.ts`

Existing multi-line barrel block (lines 13–21) and the `@store.*` line (line 30):

**OLD (barrel block at lines 13–21):**

```ts
import {
  CancelButtonComponent,
  EQUIPMENT_CONDITIONS,
  EquipmentTypeDropdownComponent,
  FormErrorMessages,
  Labels,
  parseDate,
  SaveButtonComponent,
} from '@bikerental/shared';
```

**NEW (replace that block with):**

```ts
import {
  CancelButtonComponent,
  EQUIPMENT_CONDITIONS,
  EquipmentStore,
  EquipmentTypeDropdownComponent,
  FormErrorMessages,
  Labels,
  parseDate,
  SaveButtonComponent,
} from '@bikerental/shared';
```

Then **delete** line 30 entirely:

```ts
import { EquipmentStore } from '@store.equipment.store';
```

### File 3 — `equipment-list.component.spec.ts`

**OLD (lines 7–10):**

```ts
import { Equipment, EquipmentStatus, EquipmentType } from '@ui-models';
import { EquipmentStore } from '@store.equipment.store';
import { EquipmentTypeStore } from '@store.equipment-type.store';
import { EquipmentStatusStore } from '@store.equipment-status.store';
```

**NEW:**

```ts
import { Equipment, EquipmentStatus, EquipmentType } from '@ui-models';
import { EquipmentStatusStore, EquipmentStore, EquipmentTypeStore } from '@bikerental/shared';
```

### File 4 — `equipment-dialog.component.spec.ts`

This file has **no** existing `@bikerental/shared` import; convert the `@store.*` line in place.

**OLD (line 11):**

```ts
import { EquipmentStore } from '@store.equipment.store';
```

**NEW:**

```ts
import { EquipmentStore } from '@bikerental/shared';
```

### File 5 — `equipment-type-dialog.component.ts`

Existing barrel block is at lines 10–16; the `@store.*` line is at line 8 (above the barrel block).

**OLD (line 8):**

```ts
import { EquipmentTypeStore } from '@store.equipment-type.store';
```

**Delete line 8.** Then merge `EquipmentTypeStore` into the existing barrel block (lines 10–16):

**OLD (barrel block):**

```ts
import {
  CancelButtonComponent,
  FormErrorMessages,
  Labels,
  SaveButtonComponent,
  SlugValidators,
} from '@bikerental/shared';
```

**NEW:**

```ts
import {
  CancelButtonComponent,
  EquipmentTypeStore,
  FormErrorMessages,
  Labels,
  SaveButtonComponent,
  SlugValidators,
} from '@bikerental/shared';
```

### File 6 — `equipment-type-dialog.error.spec.ts`

No existing barrel import. Convert in place.

**OLD (line 6):**

```ts
import { EquipmentTypeStore } from '@store.equipment-type.store';
```

**NEW:**

```ts
import { EquipmentTypeStore } from '@bikerental/shared';
```

### File 7 — `tariff-list.component.ts`

**OLD (lines 20–22):**

```ts
import { Tariff } from '@ui-models';
import { TariffStore } from '@store.tariff.store';
import { Labels } from '@bikerental/shared';
```

**NEW:**

```ts
import { Tariff } from '@ui-models';
import { Labels, TariffStore } from '@bikerental/shared';
```

### File 8 — `tariff-list.component.spec.ts`

**OLD (lines 6–8):**

```ts
import { Tariff, TariffStatus } from '@ui-models';
import { TariffStore } from '@store.tariff.store';
import { Labels } from '@bikerental/shared';
```

**NEW:**

```ts
import { Tariff, TariffStatus } from '@ui-models';
import { Labels, TariffStore } from '@bikerental/shared';
```

### File 9 — `tariff-dialog.component.ts`

Two `@store.*` lines (26–27) and the barrel block (28–34).

**OLD (lines 25–34):**

```ts
import { FALLBACK_PRICING_TYPE, PricingTypeSlug, Tariff, TariffWrite } from '@ui-models';
import { PricingTypeStore } from '@store.pricing-type.store';
import { TariffStore } from '@store.tariff.store';
import {
  CancelButtonComponent,
  EquipmentTypeDropdownComponent,
  FormErrorMessages,
  Labels,
  SaveButtonComponent,
} from '@bikerental/shared';
```

**NEW:**

```ts
import { FALLBACK_PRICING_TYPE, PricingTypeSlug, Tariff, TariffWrite } from '@ui-models';
import {
  CancelButtonComponent,
  EquipmentTypeDropdownComponent,
  FormErrorMessages,
  Labels,
  PricingTypeStore,
  SaveButtonComponent,
  TariffStore,
} from '@bikerental/shared';
```

### File 10 — `tariff-dialog.component.spec.ts`

**OLD (lines 8–11):**

```ts
import { TariffStore } from '@store.tariff.store';
import { PricingTypeStore } from '@store.pricing-type.store';
import { TariffDialogComponent, TariffDialogData } from './tariff-dialog.component';
import { EquipmentTypeDropdownComponent, Labels } from '@bikerental/shared';
```

**NEW:**

```ts
import { TariffDialogComponent, TariffDialogData } from './tariff-dialog.component';
import {
  EquipmentTypeDropdownComponent,
  Labels,
  PricingTypeStore,
  TariffStore,
} from '@bikerental/shared';
```

### File 11 — `tariff-dialog.error.spec.ts`

**OLD (lines 8–11):**

```ts
import { TariffStore } from '@store.tariff.store';
import { PricingTypeStore } from '@store.pricing-type.store';
import { TariffDialogComponent } from './tariff-dialog.component';
import { EquipmentTypeDropdownComponent, Labels } from '@bikerental/shared';
```

**NEW:**

```ts
import { TariffDialogComponent } from './tariff-dialog.component';
import {
  EquipmentTypeDropdownComponent,
  Labels,
  PricingTypeStore,
  TariffStore,
} from '@bikerental/shared';
```

### File 12 — `customer-detail.component.ts` (the canonical mixed-style case)

`CustomerStore` is already imported from the barrel (line 7); `CustomerFinanceStore` comes from
`@store.*` (line 11). Merge into one barrel line.

**OLD (line 7):**

```ts
import { CustomerStore, Labels, MoneyPipe } from '@bikerental/shared';
```

**NEW (line 7):**

```ts
import { CustomerFinanceStore, CustomerStore, Labels, MoneyPipe } from '@bikerental/shared';
```

Then **delete** line 11 entirely:

```ts
import { CustomerFinanceStore } from '@store.customer-finance.store';
```

### File 13 — `customer-layout.store.ts`

**OLD (lines 2–3):**

```ts
import { CustomerStore } from '@bikerental/shared';
import { CustomerFinanceStore } from '@store.customer-finance.store';
```

**NEW:**

```ts
import { CustomerFinanceStore, CustomerStore } from '@bikerental/shared';
```

### File 14 — `customer-layout.store.spec.ts`

**OLD (lines 4–5):**

```ts
import { api, CustomerStore } from '@bikerental/shared';
import { CustomerFinanceStore } from '@store.customer-finance.store';
```

**NEW:**

```ts
import { api, CustomerFinanceStore, CustomerStore } from '@bikerental/shared';
```

### File 15 — `customer-account.component.ts`

`@store.*` line is at line 21, after the barrel block (lines 12–19).

**OLD (barrel block, lines 12–19):**

```ts
import {
  Labels,
  MoneyPipe,
  TopUpButtonComponent,
  TopUpDialogComponent,
  WithdrawButtonComponent,
  WithdrawDialogComponent,
} from '@bikerental/shared';
```

**NEW:**

```ts
import {
  CustomerFinanceStore,
  Labels,
  MoneyPipe,
  TopUpButtonComponent,
  TopUpDialogComponent,
  WithdrawButtonComponent,
  WithdrawDialogComponent,
} from '@bikerental/shared';
```

Then **delete** line 21 entirely:

```ts
import { CustomerFinanceStore } from '@store.customer-finance.store';
```

### File 16 — `customer-account.component.spec.ts`

No existing barrel import on the `@store.*` line. Convert in place.

**OLD (line 7):**

```ts
import { CustomerFinanceStore } from '@store.customer-finance.store';
```

**NEW:**

```ts
import { CustomerFinanceStore } from '@bikerental/shared';
```

## 4. Validation Steps

Execute from the repo root `D:\Workspace\private\bikerental-ui`. Do NOT start the dev server, run
E2E, or inspect databases.

```bash
npm run fix
npm run build
npm test
```

`npm run fix` applies ESLint --fix + Prettier and will normalize import ordering/formatting if your
hand-written block differs slightly from Prettier output. `npm run build` must compile with zero
TypeScript errors (proves all `@bikerental/shared` symbols resolve). `npm test` must stay green
(proves DI/`useExisting` still resolves — FR-04 Scenario 3). Confirm no `@store.` substring remains
in the admin project before moving on.
