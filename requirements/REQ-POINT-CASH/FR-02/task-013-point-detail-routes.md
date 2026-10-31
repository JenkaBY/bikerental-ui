# Task 013: Point detail routes (`/points/:slug/**`) and the Cash / Bank transfers tab placeholder

> **Applied Skill:** `angular-routing` - lazy `loadChildren` route tree mirroring `CUSTOMER_PROFILE_ROUTES` (host on the empty-path child so it receives the inherited `:slug` param via `withComponentInputBinding()`; `''` redirects to `profile`; each tab is a lazily loaded child with its own deep-linkable URL). `angular-component` - standalone `OnPush` placeholder with text from `Labels`. Routes stay inside the existing `AdminLayoutComponent` children, so `adminGuard` keeps protecting them.

## 1. Objective

1. Create a tiny `PointTabPlaceholderComponent` for the `cash` and `transfers` tabs. Their real content arrives in FR-03 (`PointCashTabComponent`) and FR-04 (`PointTransfersTabComponent`), which will replace the placeholder's `loadComponent` in `point-detail.routes.ts` and delete the placeholder once both are done.
2. Create `POINT_DETAIL_ROUTES` and register `points/:slug` in the admin routes, directly after the existing `points` list route. After this task:
   * `/points/center` → redirects to `/points/center/profile` (FR-02 Scenario 1).
   * `/points/center/transfers` deep link → "Bank transfers" tab active (Scenario 2).
   * Row click (`['/points', slug]`) and post-create navigation (`['/points', slug, 'profile']`) from FR-01 Task 009 now land on the detail page (Scenario 7).

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/detail/point-tab-placeholder.component.ts`
* **Action:** Create New File

* **File Path:** `projects/admin/src/app/points/detail/point-detail.routes.ts`
* **Action:** Create New File

* **File Path:** `projects/admin/src/app/app.routes.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in each snippet below; `app.routes.ts` needs no new import)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/detail/point-tab-placeholder.component.ts`
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-point-tab-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="p-4 md:p-6 text-slate-400 text-center mt-8">{{ labels.PointTabUnavailable }}</p>
  `,
})
export class PointTabPlaceholderComponent {
  protected readonly labels = Labels;
}
```

* **Location:** Whole content of NEW file `projects/admin/src/app/points/detail/point-detail.routes.ts`
* **Snippet:**

```typescript
import type { Routes } from '@angular/router';

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
          import('./point-tab-placeholder.component').then((m) => m.PointTabPlaceholderComponent),
      },
      {
        path: 'transfers',
        loadComponent: () =>
          import('./point-tab-placeholder.component').then((m) => m.PointTabPlaceholderComponent),
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

* **Location:** `projects/admin/src/app/app.routes.ts` — inside the `AdminLayoutComponent` `children` array, directly below the existing route object

```typescript
      {
        path: 'points',
        loadComponent: () =>
          import('./points/points-page.component').then((m) => m.PointsPageComponent),
      },
```

  and directly above the existing `analytics` route object (`path: 'analytics'`).
* **Snippet:**

```typescript
      {
        path: 'points/:slug',
        loadChildren: () =>
          import('./points/detail/point-detail.routes').then((m) => m.POINT_DETAIL_ROUTES),
      },
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server. This is the first build in which Tasks 008–012 are reachable from the router, so any type error in them surfaces here — if the build fails in one of those files, STOP and report the file and error.

```bash
npx prettier --write projects/admin/src/app/points/detail/point-tab-placeholder.component.ts projects/admin/src/app/points/detail/point-detail.routes.ts projects/admin/src/app/app.routes.ts
npx ng build admin --configuration development
npx ng lint admin
```
