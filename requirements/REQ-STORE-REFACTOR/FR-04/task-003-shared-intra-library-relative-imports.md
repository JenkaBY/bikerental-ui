# Task 003: Convert shared-library `@store.*` imports to RELATIVE intra-library paths

> **Applied Skill:** `angular-di` + `angular-data-flow-orchestrator` (store provider identity /
> module-init safety) and `typescript-es2022` (SKILL.md §"Project organization" — follow the
> repository's module layout, prefer explicit relative paths inside a library). Enforces the FR-04
> design §4.1 decision: **inside `shared`, use relative paths — NEVER `@bikerental/shared`** (a
> barrel self-import reintroduces the FR-03 cyclic-init / duplicate-class-identity hazard, P-A5).

## 1. Objective

Replace the 5 `@store.*` alias imports inside the `shared` library with the correct **relative**
path to each target module under `projects/shared/src/core/state/`. Do **not** introduce
`@bikerental/shared` inside `shared`. Pure import-path refactor — no logic or assertion changes.

## 2. Files to Modify

1. `D:\Workspace\private\bikerental-ui\projects\shared\src\core\state\lookup-initializer.facade.ts`
2. `D:\Workspace\private\bikerental-ui\projects\shared\src\core\mappers\cost-calculation.mapper.ts`
3. `D:\Workspace\private\bikerental-ui\projects\shared\src\shared\components\equipment-type-dropdown\equipment-type-dropdown.component.ts`
4. `D:\Workspace\private\bikerental-ui\projects\shared\src\shared\components\equipment-type-dropdown\equipment-type-dropdown.component.spec.ts`
5. `D:\Workspace\private\bikerental-ui\projects\shared\src\shared\components\customer\customer-create-dialog\customer-create-dialog.component.ts`

- **Action:** Modify Existing Files

### Relative-path derivation (verified against the directory tree)

All targets live in `projects/shared/src/core/state/`. Target exports verified present:
`UserStore` (`user.store.ts:11`), `TimeStore` (`time.store.ts:5`),
`EquipmentTypeStore` (`equipment-type.store.ts:9`), `CustomerStore` (`customer.store.ts:9`).

| File location (under `projects/shared/src/`)                                  | Target module                  | Correct relative specifier                       |
|-------------------------------------------------------------------------------|--------------------------------|--------------------------------------------------|
| `core/state/lookup-initializer.facade.ts`                                     | `core/state/user.store`        | `./user.store`                                   |
| `core/mappers/cost-calculation.mapper.ts`                                     | `core/state/time.store`        | `../state/time.store`                            |
| `shared/components/equipment-type-dropdown/...component.ts`                   | `core/state/equipment-type.store` | `../../../core/state/equipment-type.store`    |
| `shared/components/equipment-type-dropdown/...component.spec.ts`              | `core/state/equipment-type.store` | `../../../core/state/equipment-type.store`    |
| `shared/components/customer/customer-create-dialog/...component.ts`           | `core/state/customer.store`    | `../../../../core/state/customer.store`           |

(The dropdown file already uses `../../constant/labels` and the customer-create-dialog already uses
`../../../validators/form-error-messages` — these confirm the directory depth used above.)

## 3. Code Implementation

No new symbols, no barrel — only the module specifier changes on each `@store.*` line.

### File 1 — `lookup-initializer.facade.ts`

**OLD (line 8):**

```ts
import { UserStore } from '@store.user.store';
```

**NEW:**

```ts
import { UserStore } from './user.store';
```

> Keep it grouped with the other relative store imports already present (lines 3–6 use
> `./equipment-status.store`, `./equipment-type.store`, `./pricing-type.store`, `./tariff.store`).
> Final placement is normalized by `npm run fix`.

### File 2 — `cost-calculation.mapper.ts`

**OLD (line 5):**

```ts
import { TimeStore } from '@store.time.store';
```

**NEW:**

```ts
import { TimeStore } from '../state/time.store';
```

### File 3 — `equipment-type-dropdown.component.ts`

**OLD (line 13):**

```ts
import { EquipmentTypeStore } from '@store.equipment-type.store';
```

**NEW:**

```ts
import { EquipmentTypeStore } from '../../../core/state/equipment-type.store';
```

### File 4 — `equipment-type-dropdown.component.spec.ts`

**OLD (line 4):**

```ts
import { EquipmentTypeStore } from '@store.equipment-type.store';
```

**NEW:**

```ts
import { EquipmentTypeStore } from '../../../core/state/equipment-type.store';
```

### File 5 — `customer-create-dialog.component.ts`

**OLD (line 13):**

```ts
import { CustomerStore } from '@store.customer.store';
```

**NEW:**

```ts
import { CustomerStore } from '../../../../core/state/customer.store';
```

## 4. Validation Steps

Execute from the repo root `D:\Workspace\private\bikerental-ui`. Do NOT start the dev server, run
E2E, or inspect databases.

```bash
npm run fix
npm run build
npm test
```

`npm run build` must compile clean (proves each relative path resolves to a module that actually
exports the named store). `npm test` must stay green — this is the load-bearing check that the
shared injectables keep a single class identity (FR-04 Scenario 3 / FR-03 P-A5). Confirm no
`@store.` substring and no `@bikerental/shared` import remain anywhere under `projects/shared`.
