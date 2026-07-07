# Task 009: Export AgreementTemplateStore from public-api.ts

> **Applied Skill:** `typescript-es2022` (barrel re-export convention) — makes
> `AgreementTemplateStore` importable via `@bikerental/shared`, matching every other store in this
> barrel, per FR-01's design section 3 ("`public-api.ts` exports the store ... after the other
> stores").

## 1. Objective

Add one export line for `agreement-template.store.ts` to `public-api.ts`, placed after the other
signal-state store exports.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** Immediately after `export * from './core/state/time.store';` (the last line of
  the "Core — signal state stores" block, right before the
  `// Shared UI — components` comment).
* **Snippet:**

```typescript
export * from './core/state/agreement-template.store';
```

**Resulting block tail (for reference):**

```typescript
export * from './core/state/time-travel-store.token';
export * from './core/state/time.store';
export * from './core/state/agreement-template.store';

// Shared UI — components
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
