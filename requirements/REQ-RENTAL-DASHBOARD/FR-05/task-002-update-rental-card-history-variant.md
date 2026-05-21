# Task 002: Update RentalCardComponent — History Variant Row 2 + Debt Warning

> **Applied Skill:** `angular-component` — `computed()` host bindings, `@if…as` template
> pattern, variant-driven conditional rendering.

## 1. Objective

Extend `projects/operator/src/app/dashboard/rental-card.component.ts` to:

1. Add an `isWarning` computed that covers both overdue (active) and debt (history) warning treatment,
   replacing the direct `item().isOverdue` references in the host bindings.
2. Implement the `history` variant row 2: debt cards show "Debt · Ended HH:mm" in warning color;
   all other statuses show "Ended HH:mm" in default color.
3. Handle DRAFT card navigation — tap navigates to `/rentals/new` instead of `/rentals/:id`.

**Depends on:** Task 001 (labels `Ended`).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-card.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Change 1 — Replace host bindings to use `isWarning()`:**

* **Location:** Inside the `host` object of `@Component`, replace the three `item().isOverdue`
  class bindings.

```typescript
  host: {
    '(click)': 'navigateToDetail()',
    'class': 'block cursor-pointer select-none transition-colors duration-200 rounded-lg p-3 shadow-sm border border-transparent bg-white',
    '[class.bg-amber-50]': 'isWarning()',
    '[class.border-l-4]': 'isWarning()',
    '[class.border-l-amber-400]': 'isWarning()',
  },
```

**Change 2 — Add `isWarning` computed (insert after `readonly variant = input...`):**

* **Location:** Inside `RentalCardComponent` class body — add after `readonly variant = input<'active' | 'history'>('active');`

```typescript
  readonly isWarning = computed(() => this.item().isOverdue || this.item().isDebt);
```

**Change 3 — Add history variant row 2 in template (insert after the closing `}` of the active `@if` block):**

* **Location:** In the template, directly after the closing `}` of `@if (variant() === 'active') { ... }`.

```html
    @if (variant() === 'history') {
      <div class="mt-1 text-sm">
        @if (item().isDebt) {
          <span class="text-amber-600">
            {{ Labels.RentalStatusDebt }}
            @if (item().expectedReturnAt; as endedAt) {
              &nbsp;&middot;&nbsp;{{ Labels.Ended }}&nbsp;{{ endedAt | date: 'HH:mm' }}
            }
          </span>
        } @else {
          <span class="text-slate-500">
            @if (item().expectedReturnAt; as endedAt) {
              {{ Labels.Ended }}&nbsp;{{ endedAt | date: 'HH:mm' }}
            }
          </span>
        }
      </div>
    }
```

**Change 4 — Update `navigateToDetail()` to handle DRAFT navigation:**

* **Location:** Replace the existing `navigateToDetail()` method body.

```typescript
  protected navigateToDetail(): void {
    if (this.variant() === 'history' && this.item().status === 'DRAFT') {
      void this.router.navigate(['/rentals/new'], {
        queryParams: { rentalId: this.item().id },
      });
      return;
    }
    void this.router.navigate(['/rentals', this.item().id]);
  }
```

**Key implementation notes:**

- `isWarning = computed(() => item().isOverdue || item().isDebt)` unifies the visual warning
  treatment for both active-overdue cards (FR-04) and history-debt cards (FR-05). Host bindings
  now reference `isWarning()` instead of `item().isOverdue` directly.
- History row 2 uses `item().expectedReturnAt` as the proxy for "ended at" — the `RentalListItem`
  domain model does not carry an explicit `endedAt` field. For completed rentals, `expectedReturnAt`
  represents the planned (and typically actual) return time. If the value is absent, row 2 renders
  empty (no `Ended` label shown).
- Debt history row 2 uses `Labels.RentalStatusDebt` (already exists) as the debt indicator;
  the monetary amount is not available on `RentalListItem` (see FR-05 design § 3 constraint).
- DRAFT navigation: routes to `/rentals/new` with `queryParams: { rentalId: item().id }`.
  **Verify** that `RentalCreateComponent` reads and acts on the `rentalId` query parameter to
  resume the correct draft rental. If the param name differs, align it with the
  `RentalCreateComponent` implementation.
- `variant()` is checked before `item().status === 'DRAFT'` in `navigateToDetail()` so active
  DRAFT cards (if any future state adds them) still navigate to `/rentals/:id` by default.

---

## 4. Validation Steps

skip
