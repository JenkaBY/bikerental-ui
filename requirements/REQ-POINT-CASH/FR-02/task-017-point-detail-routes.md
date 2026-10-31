# Task 017: Admin routes for /points/:slug/{profile|cash|transfers|operations}

> **Applied Skill:** `angular-routing` - lazy `loadChildren` route tree, `''` child redirects to `profile` (`pathMatch: 'full'`), lazy `loadComponent` per tab; same shape as `CUSTOMER_PROFILE_ROUTES`. The host sits on an empty-path child of `points/:slug`, so it inherits `:slug` and `withComponentInputBinding()` (already enabled in `projects/admin/src/app/app.config.ts`) binds it to `PointDetailPageComponent.slug`.

## 1. Objective

Wire the detail route tree. After this task FR-01's row click (`/points/:slug`) and create flow
(`/points/:slug/profile`) resolve. The route stays behind the existing admin guards (it is a child
of the guarded `AdminLayoutComponent` route).

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-detail.routes.ts` - **Action:** Create New File
* **File Path:** `projects/admin/src/app/app.routes.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/admin/src/app/points/point-detail.routes.ts` - full content.
* **Snippet:**

```typescript
import { Routes } from '@angular/router';

export const POINT_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./point-detail-page.component').then((m) => m.PointDetailPageComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./point-profile-tab.component').then((m) => m.PointProfileTabComponent),
      },
      {
        path: 'cash',
        loadComponent: () =>
          import('./point-cash-tab.component').then((m) => m.PointCashTabComponent),
      },
      {
        path: 'transfers',
        loadComponent: () =>
          import('./point-transfers-tab.component').then((m) => m.PointTransfersTabComponent),
      },
      {
        path: 'operations',
        loadComponent: () =>
          import('./point-operations-tab.component').then((m) => m.PointOperationsTabComponent),
      },
    ],
  },
];
```

* **Location:** `projects/admin/src/app/app.routes.ts` - directly below the existing `points` route object
  (the one whose `loadComponent` imports `./points/points-page.component`), insert:
* **Snippet:**

```typescript
      {
        path: 'points/:slug',
        loadChildren: () =>
          import('./points/point-detail.routes').then((m) => m.POINT_DETAIL_ROUTES),
      },
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-detail.routes.ts projects/admin/src/app/app.routes.ts
npx ng build admin --configuration development
npx ng lint admin
```
