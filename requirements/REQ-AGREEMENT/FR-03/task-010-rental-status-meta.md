# Task 010: AWAITING_SIGNATURE rental status meta entry

> **Applied Skill:** `angular-data-flow-orchestrator` — the presentation map used by badges/labels
> across admin+operator must cover the new status value, per FR-03 design section 3, bullet 7.

## 1. Objective

Add an `AWAITING_SIGNATURE` entry to the `RentalStatus` map so `mapRentalStatus('AWAITING_SIGNATURE')`
resolves to a proper color/label/badge instead of the default fallback.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/rental-status.meta.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — `Labels` is already imported.

**Code to Add/Replace:**

* **Location:** Inside the `RentalStatus` record, immediately after the `DRAFT: {...},` entry,
  before the `ACTIVE: {...},` entry.
* **Snippet:**

```typescript
  DRAFT: {
    slug: 'DRAFT',
    color: 'default',
    labelKey: 'rentalStatus.draft',
    label: Labels.RentalStatusDraft,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  AWAITING_SIGNATURE: {
    slug: 'AWAITING_SIGNATURE',
    color: 'accent',
    labelKey: 'rentalStatus.awaitingSignature',
    label: Labels.RentalStatusAwaitingSignature,
    badgeClasses: 'bg-purple-100 text-purple-700',
  },
  ACTIVE: {
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
