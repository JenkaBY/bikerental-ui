# Task 013: Export AgreementSigningStore from public-api

> **Applied Skill:** Shared Import Convention (`AGENTS.md`) — cross-project code (the `operator`
> project) must import `AgreementSigningStore` only via `@bikerental/shared`, so it must be
> re-exported from the barrel, per FR-03 design section 3, bullet 14 (the dialog/service
> themselves live in `projects/operator` and are NOT exported from shared).

## 1. Objective

Add `agreement-signing.store` to the `public-api.ts` state exports block.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None.

**Code to Add/Replace:**

* **Location:** Immediately after the last state-store export line,
  `export * from './core/state/agreement-template.store';`.
* **Snippet:**

```typescript
export * from './core/state/agreement-template.store';
export * from './core/state/agreement-signing.store';
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
