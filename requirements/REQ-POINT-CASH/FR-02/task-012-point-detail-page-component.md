# Task 012: `PointDetailPageComponent` (smart host: header, tabs, point-scoped stores)

> **Applied Skill:** `angular-component` - smart host, standalone, `OnPush`, `inject()`, `input.required()` bound from the route by `withComponentInputBinding()` (URL is the source of truth for the slug). `angular-di` - the host `providers` hold every point-scoped store so all tabs share one instance and everything is discarded when the admin leaves `/points/:slug/**`. `angular-rxjs-streams` - `toObservable(slug)` + `switchMap` (switching to another slug cancels the previous load) + `takeUntilDestroyed()`. `angular-routing` - `SegmentedTabsComponent` in `linkMode` (relative `routerLink` per tab id) over a child `<router-outlet />`; Back uses `router.navigate(['/points'])` (route segments, never a hand-built URL). `error-handling` - the point request is sent with `suppressErrorNotification()`, parsed with `ApiErrorParser.parse`, copy via `ErrorMessageResolver` / `Labels.PointNotFound`, shown via `NotificationService`. Layout mirrors `CustomerDetailComponent` (shared `PageHeaderComponent` + `SegmentedTabsComponent`).

## 1. Objective

Create the host for `/points/:slug/{profile|cash|transfers|operations}`:

* **Providers:** `PointAdminStore`, `PointCashStore`, `PointMoneyRefreshFacade`, `providePointMoneyApi()`. (FR-04 will add `BankTransferHistoryStore` here — do NOT add it now.)
* **Load sequence per slug:** `PointAdminStore.loadOne(slug, { context: suppressErrorNotification() })`; on success `PointCashStore.load(slug, TimeStore.getCurrentDate())`. Tab switches do not recreate the host, so neither request is repeated (FR-02 Scenario 3).
* **Unknown slug (HTTP 404):** `NotificationService.warn(Labels.PointNotFound)` and navigate to `/points` (FR-02 Scenario 8). **Any other load error:** `NotificationService.error(resolved message)` and navigate to `/points`.
* **Header** (`PageHeaderComponent`, back → `/points`, back label `Labels.PointBackToList`): while the point is loading an indeterminate progress bar; once loaded: name, status pill (`POINT_STATUS_LABELS` / `POINT_STATUS_CLASSES`), "street, city, country · slug" on the second line, and in the `actions` slot two `PointBalancePillComponent`s: `Labels.PointBalanceCash` + `cashBalance()`, `Labels.PointBalanceTerminal` + `terminalBalance()` (em-dash while loading / on failure).
* **Tabs** (`linkMode`): Profile `profile`, Cash `cash`, Bank transfers `transfers`, Operations `operations`.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/detail/point-detail-page.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/detail/point-detail-page.component.ts`
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterOutlet } from '@angular/router';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  PageHeaderComponent,
  PointAdminStore,
  PointCashStore,
  PointMoneyRefreshFacade,
  providePointMoneyApi,
  SegmentedTabsComponent,
  type SegmentTab,
  suppressErrorNotification,
  TimeStore,
} from '@bikerental/shared';
import { POINT_STATUS_CLASSES, POINT_STATUS_LABELS } from '../point-status';
import { PointBalancePillComponent } from './point-balance-pill.component';

@Component({
  selector: 'app-point-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointAdminStore, PointCashStore, PointMoneyRefreshFacade, providePointMoneyApi()],
  imports: [
    RouterOutlet,
    MatProgressBarModule,
    PageHeaderComponent,
    SegmentedTabsComponent,
    PointBalancePillComponent,
  ],
  template: `
    <div class="flex flex-col h-full -mx-4 -mt-4">
      <app-page-header [backLabel]="labels.PointBackToList" (back)="goBack()">
        @if (point(); as p) {
          <div class="flex flex-col flex-1 min-w-0">
            <span class="flex items-center gap-2 min-w-0">
              <span class="font-semibold text-slate-800 truncate">{{ p.name }}</span>
              <span
                class="shrink-0 px-2 py-0.5 rounded-full text-xs"
                [class]="statusClasses[p.status]"
              >
                {{ statusLabels[p.status] }}
              </span>
            </span>
            <span class="text-sm text-slate-500 truncate">
              {{ addressLine() }} · <span class="font-mono">{{ p.slug }}</span>
            </span>
          </div>
        } @else {
          <mat-progress-bar mode="indeterminate" class="flex-1" />
        }

        @if (point()) {
          <div actions class="flex items-center gap-2">
            <app-point-balance-pill
              [label]="labels.PointBalanceCash"
              [amount]="cash.cashBalance()"
            />
            <app-point-balance-pill
              [label]="labels.PointBalanceTerminal"
              [amount]="cash.terminalBalance()"
            />
          </div>
        }
      </app-page-header>

      <app-segmented-tabs [tabs]="tabs" linkMode />

      <div class="flex-1 overflow-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class PointDetailPageComponent {
  readonly slug = input.required<string>();

  protected readonly labels = Labels;
  protected readonly statusLabels = POINT_STATUS_LABELS;
  protected readonly statusClasses = POINT_STATUS_CLASSES;
  protected readonly tabs: SegmentTab[] = [
    { id: 'profile', label: Labels.PointTabProfile },
    { id: 'cash', label: Labels.PointTabCash },
    { id: 'transfers', label: Labels.PointTabTransfers },
    { id: 'operations', label: Labels.PointTabOperations },
  ];

  protected readonly registry = inject(PointAdminStore);
  protected readonly cash = inject(PointCashStore);

  private readonly time = inject(TimeStore);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = new ErrorMessageResolver();

  protected readonly point = this.registry.selected;
  protected readonly addressLine = computed(() => {
    const address = this.point()?.address;
    return address
      ? [address.street, address.city, address.country].filter(Boolean).join(', ')
      : '';
  });

  constructor() {
    toObservable(this.slug)
      .pipe(
        switchMap((slug) =>
          this.registry.loadOne(slug, { context: suppressErrorNotification() }).pipe(
            tap(() => this.cash.load(slug, this.time.getCurrentDate())),
            catchError((err: unknown) => {
              this.handleLoadError(err);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected goBack(): void {
    this.router.navigate(['/points']);
  }

  private handleLoadError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    if (apiError.status === 404) {
      this.notifications.warn(Labels.PointNotFound);
    } else {
      this.notifications.error(this.resolver.resolve(apiError));
    }
    this.router.navigate(['/points']);
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server. (The page is not routed yet; it is fully type-checked by the build once Task 013 adds the route.)

```bash
npx prettier --write projects/admin/src/app/points/detail/point-detail-page.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
