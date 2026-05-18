# Task 004: Register `/rentals/:id` Route

> **Applied Skill:** `angular-routing` — lazy-loaded route registration, path ordering rule.

## 1. Objective

Add a lazy-loaded `rentals/:id` route to
`projects/operator/src/app/app.routes.ts` that maps to `RentalDetailComponent`. The route must
appear **after** `rentals/new` so that the literal segment `new` is matched first and never
interpreted as a numeric ID.

**Depends on:** Task 003 (`RentalDetailComponent` file created).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/app.routes.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Code to Add:**

* **Location:** Inside the `children` array — insert the new route entry immediately **after**
  the existing `rentals/new` entry and **before** the `return` entry.

Current file (relevant excerpt):

```typescript
      {
        path: 'rentals/new',
        loadComponent: () =>
          import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
      },
      {
        path: 'return',
```

**Replace with:**

```typescript
      {
        path: 'rentals/new',
        loadComponent: () =>
          import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
      },
      {
        path: 'rentals/:id',
        loadComponent: () =>
          import('./rental-detail/rental-detail.component').then(
            (m) => m.RentalDetailComponent,
          ),
      },
      {
        path: 'return',
```

**Key implementation notes:**

- Angular matches routes in array order. `rentals/new` must appear before `rentals/:id` so
  navigating to `/rentals/new` loads `RentalCreateComponent`, not `RentalDetailComponent`.
  The current array already has `rentals` (exact path, full `pathMatch` via the `loadComponent`
  pattern) followed by `rentals/new`. Inserting `rentals/:id` immediately after `rentals/new`
  preserves this ordering contract.
- No `pathMatch: 'full'` is needed — Angular uses prefix matching by default for child routes
  and `rentals/:id` naturally requires exactly one segment after `rentals`.
- `withComponentInputBinding()` is already configured in `app.config.ts`, so the `:id` param
  is automatically bound to `RentalDetailComponent.id = input.required<string>()` without any
  additional route configuration.
- No guards are added — all routes are currently open per the project constraint (TASK002).

---

## 4. Validation Steps

skip