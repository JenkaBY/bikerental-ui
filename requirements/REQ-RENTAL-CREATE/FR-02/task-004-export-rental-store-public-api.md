# Task 004: Export `RentalStore` from the Shared Library Public API

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 3: any new store created in `core/state/` must be re-exported through `projects/shared/src/public-api.ts` so all consuming SPAs (operator, admin) can import it from `@bikerental/shared`.

## 1. Objective

Add a barrel export line for `RentalStore` to `projects/shared/src/public-api.ts`. Without this step the operator application cannot import `RentalStore` from `@bikerental/shared`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

None — this task only adds one export line to the barrel.

**Code to Add/Replace:**

* **Location:** Inside the `// Core — signal state stores` section, appended after the `export * from './core/state/customer.store';` line.

Find this block:

```typescript
export * from './core/state/customer.store';
export * from './core/state/user.store';
```

Replace it with:

```typescript
export * from './core/state/customer.store';
export * from './core/state/rental.store';
export * from './core/state/user.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
```
