# Task 003: Create RentalDashboardComponent

> **Applied Skill:** `angular-component` — standalone, `OnPush`, `input()`, `computed()`,
> `effect()`. `angular-routing` — `withComponentInputBinding()` for query-param binding,
> `Router.navigate` with `replaceUrl`.

## 1. Objective

Create the smart `RentalDashboardComponent` at the `/rentals` route. It:

- Provides `RentalListStore` in its own `providers` array (store lifetime = route visit lifetime).
- Reads the `?tab=` query parameter via the signal `input()` (resolved by
  `withComponentInputBinding()` in `app.config.ts`).
- Renders a top bar (page title + refresh icon button with loading spinner).
- Renders a Material tab nav bar (Active / Today's History); tab switching updates the URL
  with `replaceUrl: true`.
- Conditionally renders `RentalActiveTabComponent` (Active tab) or a placeholder comment
  (History tab — FR-03 will replace it).
- Uses an `effect()` to trigger `store.loadHistory` when the active tab changes to `'history'`
  and no history data is loaded yet.

**Depends on:** Task 001 (Labels), Task 002 (RentalActiveTabComponent),
FR-01 Task 004 (RentalListStore).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-dashboard.component.ts`
* **Action:** Create New File

* **File Path:** `projects/operator/src/app/dashboard/rental-history-tab.component.ts`
* **Action:** Create New File (placeholder — replaced entirely in FR-03)

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalActiveTabComponent } from './rental-active-tab.component';
import { RentalHistoryTabComponent } from './rental-history-tab.component';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Labels, RentalListStore } from '@bikerental/shared';
import { RentalActiveTabComponent } from './rental-active-tab.component';
import { RentalHistoryTabComponent } from './rental-history-tab.component';

@Component({
  selector: 'app-rental-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalListStore],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    RentalActiveTabComponent,
    RentalHistoryTabComponent,
  ],
  template: `
    <div class="-mx-4 -mt-4">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h1 class="text-xl font-semibold text-slate-800">{{ Labels.Rentals }}</h1>
        <button
          mat-icon-button
          [disabled]="isLoading()"
          (click)="onRefresh()"
          [attr.aria-label]="Labels.Refresh"
        >
          @if (isLoading()) {
            <mat-progress-spinner diameter="20" mode="indeterminate" />
          } @else {
            <mat-icon>refresh</mat-icon>
          }
        </button>
      </div>
      <nav mat-tab-nav-bar [tabPanel]="tabPanel">
        <a mat-tab-link [active]="activeTab() === 'active'" (click)="onTabChange('active')">
          {{ Labels.ActiveTab }}
        </a>
        <a mat-tab-link [active]="activeTab() === 'history'" (click)="onTabChange('history')">
          {{ Labels.TodaysHistoryTab }}
        </a>
      </nav>
    </div>
    <mat-tab-nav-panel #tabPanel>
      @if (activeTab() === 'active') {
        <app-rental-active-tab
          [activeRentals]="store.activeRentals()"
          [isLoadingActive]="store.isLoadingActive()"
        />
      } @else {
        <app-rental-history-tab />
      }
    </mat-tab-nav-panel>
  `,
})
export class RentalDashboardComponent {
  protected readonly store = inject(RentalListStore);
  private readonly router = inject(Router);

  readonly tab = input<string>();

  readonly activeTab = computed(() => (this.tab() === 'history' ? 'history' : 'active'));

  readonly isLoading = computed(() =>
    this.activeTab() === 'active'
      ? this.store.isLoadingActive()
      : this.store.isLoadingHistory(),
  );

  protected readonly Labels = Labels;

  constructor() {
    effect(() => {
      if (this.activeTab() === 'history' && this.store.historyRentals().length === 0) {
        const todayStr = this.getTodayDateString();
        this.store.loadHistory(todayStr, todayStr);
      }
    });
  }

  protected onTabChange(tab: 'active' | 'history'): void {
    void this.router.navigate([], {
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected onRefresh(): void {
    if (this.activeTab() === 'active') {
      this.store.loadActive();
    } else {
      const todayStr = this.getTodayDateString();
      this.store.loadHistory(todayStr, todayStr);
    }
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
```

---

### 3.2 — Create placeholder `rental-history-tab.component.ts`

FR-03 will **replace** this file entirely. Create it now so `RentalDashboardComponent`
compiles without errors.

* **Location:** New file — full file content

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-rental-history-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class RentalHistoryTabComponent {}
```

**Key implementation notes:**

- `providers: [RentalListStore]` — binds the store's lifetime to the route visit. A fresh store
  (and therefore fresh `rxResource` requests) is created on each navigation to `/rentals`.
- `tab = input<string>()` — receives the `?tab=` query parameter automatically because
  `withComponentInputBinding()` is enabled in `app.config.ts`. No `ActivatedRoute` injection
  needed.
- `activeTab = computed(...)` — the single source of truth for which tab is active. Defaults to
  `'active'` for any value other than `'history'` (including `undefined` when the query param
  is absent).
- `effect()` in the constructor reacts to `activeTab()` signal changes. When the history tab
  becomes active and `historyRentals` is still empty, it calls `loadHistory(today, today)`.
  This handles both direct URL navigation to `?tab=history` and user tab-switching. The guard
  `historyRentals().length === 0` prevents duplicate fetches on refresh.
- `onTabChange` writes `?tab=...` to the URL with `replaceUrl: true` to avoid polluting the
  browser history stack; the `tab` input is automatically updated by the router, which
  re-evaluates `activeTab()`.
- `getTodayDateString()` returns `'YYYY-MM-DD'`; the store's `loadHistory` wraps it in `new Date(...)`.
- The `-mx-4 -mt-4` wrapper on the top bar and tab bar negates the `p-4` padding applied by
  `OperatorLayoutComponent`'s `<main>` element, allowing full-width borders.
- `RentalHistoryTabComponent` is imported from `./rental-history-tab.component`. A minimal
  empty placeholder is created in step 3.2 of this task. FR-03 will replace it with the full
  history tab implementation.
- The `@if / @else` in `mat-tab-nav-panel` removes the inactive tab body from the DOM on
  every tab switch, satisfying the FR requirement for both tabs.

---

## 4. Validation Steps

```bash
ng build operator --configuration=development
```

Expected: zero TypeScript errors. The component compiles and all Angular Material + shared
library imports resolve.
