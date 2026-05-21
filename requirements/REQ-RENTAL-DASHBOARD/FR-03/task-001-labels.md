# Task 001: Add History Tab i18n Labels

> **Applied Skill:** `angular-component` — i18n rule: all visible text via `Labels` constants.

## 1. Objective

Add two new `Labels` constants used by `RentalHistoryTabComponent`. Filter button labels for
All / Completed / Debt / Cancelled reuse existing constants already in the class.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Code to Add:**

* **Location:** Append after `static readonly Refresh = $localize\`Refresh\`;` — inside the
  `Labels` class body, before the closing `}`.

```typescript
  static readonly
FilterDrafts = $localize`Drafts`;
static readonly
Records = $localize`records`;
```

**Reused constants (no new entries needed):**

| Filter button | Existing constant              |
|---------------|--------------------------------|
| "All"         | `Labels.All`                   |
| "Completed"   | `Labels.RentalStatusCompleted` |
| "Debt"        | `Labels.RentalStatusDebt`      |
| "Cancelled"   | `Labels.RentalStatusCancelled` |

---

## 4. Validation Steps

skip
