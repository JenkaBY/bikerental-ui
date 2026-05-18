# Task 001: Add Active Card i18n Labels

> **Applied Skill:** `angular-component` — i18n rule: all visible text must be declared as
> `Labels` constants via `$localize`.

## 1. Objective

Add three new `Labels` constants required by `RentalCardComponent` and `RentalActiveCardListComponent`:
the empty-state message, the overdue prefix, and the "remaining" suffix.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Code to Add:**

* **Location:** Append after `static readonly Records = $localize\`records\`;` — inside the
  `Labels` class body, before the closing `}`.

```typescript
  static readonly
NoActiveRentals = $localize`No active rentals`;
static readonly
OverdueBy = $localize`Overdue by`;
static readonly
Remaining = $localize`remaining`;
```

**Key implementation notes:**

- `OverdueBy` is used as a prefix: `{{ Labels.OverdueBy }} {{ item.overdueMinutes }} {{ Labels.MinuteShort }}`
  → "Overdue by 20 min". `Labels.MinuteShort` already exists (`$localize\`min\``).
- `Remaining` is used as a suffix: `{{ minutes }} {{ Labels.MinuteShort }} {{ Labels.Remaining }}`
  → "45 min remaining".
- `NoActiveRentals` is the empty-state message shown in `RentalActiveCardListComponent` when
  `items` is empty and `isLoading` is `false`.

---

## 4. Validation Steps

skip
