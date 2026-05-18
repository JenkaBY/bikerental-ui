# Task 004: Update RentalHistoryTabComponent — Rewire List Binding

> **Applied Skill:** `angular-component` — template binding update.

## 1. Objective

Update the template of
`projects/operator/src/app/dashboard/rental-history-tab.component.ts` to replace the
`[rentals]` / `[isLoading]` bindings with a self-contained `<app-rental-history-card-list />`
element. The `sortedHistoryRentals` computed is no longer needed here — it lives in
`RentalHistoryCardListComponent` (Task 003).

**Depends on:** Task 003 (`RentalHistoryCardListComponent` with no inputs).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-history-tab.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Change — Replace the `<app-rental-history-card-list>` element in the template:**

* **Location:** Inside the `template` string — replace the existing
  `<app-rental-history-card-list [rentals]="..." [isLoading]="..."/>` element.

```html
    <app-rental-history-card-list />
```

**Key implementation notes:**

- No bindings are passed — `RentalHistoryCardListComponent` now injects `RentalListStore`
  directly and manages both sorting and loading state internally.
- The TypeScript compiler will raise an error on the old `[rentals]` binding once the placeholder
  input is removed in Task 003, making this change mandatory before the build passes.
- No class-body changes are needed in `RentalHistoryTabComponent` for this task.

---

## 4. Validation Steps

```powershell
npm run build -- --project operator
```