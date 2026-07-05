# Task 001: Add `version` to RentalDetailState

> **Applied Skill:** `angular-signals` — extending the existing signal-backed state shape with the
> optimistic-lock fencing token needed by the signing flow (FR-03 design section 3, bullet 1).

## 1. Objective

Add a nullable `version: number | null` field to `RentalDetailState` so `RentalStore` can track the
rental's optimistic-lock version returned by lifecycle transitions and the initial `GET`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.state.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — no new imports.

**Code to Add/Replace:**

* **Location:** Inside `RentalDetailState`, immediately after the `status: string;` line.
* **Snippet:**

```typescript
export interface RentalDetailState extends RentalState {
  status: string;
  version: number | null;
  customerId: string;
```

(Replace the existing two-line block `status: string;` / `customerId: string;` with the three-line
block above — only `version: number | null;` is new, inserted between them.)

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
