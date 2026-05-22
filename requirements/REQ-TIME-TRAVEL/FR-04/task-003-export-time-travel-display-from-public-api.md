# Task 003: Export `TimeTravelDisplayComponent` from the Shared Public API Barrel

> **Applied Skill:** `angular-di` — shared library symbol made available through the single public barrel path so Admin and Operator SPAs can reference it without deep relative imports

## 1. Objective

Add `TimeTravelDisplayComponent` to `projects/shared/src/public-api.ts` so any downstream consumer (e.g. a lazy-loaded host or test harness) can import it from `@bikerental/shared` rather than a deep relative path.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a barrel re-export line
```

**Code to Add/Replace:**

* **Location:** Inside the `// Shared UI — components` block, append the new export **after** the existing `export * from './shared/components/app-toolbar/app-toolbar.component';` line.

* **Snippet (Add after `export * from './shared/components/app-toolbar/app-toolbar.component';`):**

```typescript
export * from './shared/components/time-travel-display/time-travel-display.component';
```

The relevant section of `public-api.ts` should look like this after the change:

```typescript
// Shared UI — components
export * from './shared/components/app-brand/app-brand.component';
export * from './shared/components/app-toolbar/app-toolbar.component';
export * from './shared/components/time-travel-display/time-travel-display.component';
export * from './shared/components/bottom-nav/bottom-nav.component';
```

## 4. Validation Steps

skip