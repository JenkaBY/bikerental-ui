# Task 013: Register Admin Agreements Route

> **Applied Skill:** `angular-routing` (lazy `loadComponent` route, matching the existing pattern
> for every other admin feature) — adds the `agreements` route per FR-01's design section 3
> ("add lazy route `agreements` → `AgreementListComponent` (after `tariffs`)").

## 1. Objective

Add a lazy-loaded `agreements` child route to the admin layout's route children, placed
immediately after the `tariffs` route.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/app.routes.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none — `loadComponent` uses a dynamic `import()`, no static import needed.

**Code to Add/Replace:**

* **Location:** Immediately after the closing `},` of the `tariffs` route object (right before
  the `{ path: 'customers', ...` route) inside the `children: [...]` array.
* **Snippet:**

```typescript
      {
        path: 'agreements',
        loadComponent: () =>
          import('./agreements/agreement-list.component').then((m) => m.AgreementListComponent),
      },
```

**Resulting excerpt (for reference):**

```typescript
      {
        path: 'tariffs',
        loadComponent: () =>
          import('./tariffs/tariff-list.component').then((m) => m.TariffListComponent),
      },
      {
        path: 'agreements',
        loadComponent: () =>
          import('./agreements/agreement-list.component').then((m) => m.AgreementListComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
      },
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
