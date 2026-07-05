# Task 002: Map `version` in RentalDashboardMapper.toDetailState

> **Applied Skill:** `angular-data-flow-orchestrator` — the mapper is the single point where the raw
> `RentalResponse.version` (required, per the generated model) enters the UI-facing
> `RentalDetailState`, per FR-03 design section 3, bullet 2.

## 1. Objective

Populate the new `version` field of `RentalDetailState` from `RentalResponse.version` inside
`RentalDashboardMapper.toDetailState`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/rental-dashboard.mapper.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — no new imports.

**Code to Add/Replace:**

* **Location:** Inside `toDetailState`'s returned object literal, immediately after `status: r.status,`.
* **Snippet:**

```typescript
    return {
      id: r.id,
      status: r.status,
      version: r.version,
      customerId: r.customerId,
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
