# Task 002: Export `TimeTravelStore` from the Shared Public API Barrel

> **Applied Skill:** `angular-di` — store is `providedIn: 'root'`; its symbol must be available via the library's single public import path so that `app.config.ts` in Admin and Operator can inject it without deep relative paths

## 1. Objective

Add `TimeTravelStore` to `projects/shared/src/public-api.ts` so that Admin and Operator SPAs can import it from `@shared` (or wherever the library is aliased) rather than a deep internal path.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a barrel re-export line
```

**Code to Add/Replace:**

* **Location:** Inside the `// Core — signal state stores` block, append the new export **after** the existing last state export line `export * from './core/state/user.store';`.

* **Snippet (Add after `export * from './core/state/user.store';`):**

```typescript
export * from './core/state/time-travel.store';
```

The relevant section of `public-api.ts` should look like this after the change:

```typescript
// Core — signal state stores
export * from './core/state/equipment-status.store';
export * from './core/state/equipment-type.store';
export * from './core/state/equipment.store';
export * from './core/state/pricing-type.store';
export * from './core/state/tariff.store';
export * from './core/state/lookup-initializer.facade';
export * from './core/state/customer.store';
export * from './core/state/customer-finance.store';
export * from './core/state/customer-list.store';
export * from './core/state/equipment-search.store';
export * from './core/state/rental.store';
export * from './core/state/rental-store.token';
export * from './core/state/batch-rental-property.store';
export * from './core/state/rental-list.store';
export * from './core/state/rental-cost-calculation.store';
export * from './core/state/rental-validation.store';
export * from './core/state/user.store';
export * from './core/state/time-travel.store';
```

## 4. Validation Steps

skip