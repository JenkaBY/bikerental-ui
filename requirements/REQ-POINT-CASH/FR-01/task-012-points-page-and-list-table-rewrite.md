# Task 012: Rewrite the points page as a full-width list and reshape PointListComponent into the money table

> **Applied Skill:** `angular-component` - smart page (DI, store orchestration, navigation) + dumb table (`input()` / `output()`, `OnPush`); components < 200 lines. CLAUDE.md "Signal Store pattern" - feature stores provided in the page's `providers: []`. Customers list pattern (`projects/admin/src/app/customers/customer-list.component.ts`) - title + "create" raised button top-right, `mat-table` with clickable rows, `MatDialog` create flow. `angular-eslint` template accessibility - clickable rows get `tabindex="0"` and `(keydown.enter)`. `angular-rxjs-streams` - `takeUntilDestroyed(destroyRef)` on `afterClosed()`.

## 1. Objective

Replace the two-pane master/detail Points screen with the FR-01 list page:
title + "New point" action, three summary cards, "Show closed points" checkbox with the
"Closed hidden: N" counter, and the money table. Row click -> `/points/:slug` (FR-02 route).
"New point" -> `PointCreateDialogComponent` -> on success `/points/:slug/profile`. The old
`PointDetailComponent` is deleted and the two labels only it and the old list used are removed.

> **Ships together with FR-02.** After this task a row click navigates to `/points/:slug`, which
> only exists once FR-02's routes (FR-02 task-017) are in place. Do not release FR-01 alone.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-list.component.ts` - **Action:** Modify Existing File (replace whole content)
* **File Path:** `projects/admin/src/app/points/points-page.component.ts` - **Action:** Modify Existing File (replace whole content)
* **File Path:** `projects/admin/src/app/points/point-detail.component.ts` - **Action:** Delete File
* **File Path:** `projects/admin/src/app/points/point-detail.component.html` - **Action:** Delete File
* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File (remove two lines)

`point-status-actions.component.ts` and `point-status.ts` are kept unchanged (FR-02 reuses them).

## 3. Code Implementation

**Imports Required:** (included in each snippet below)

**Code to Add/Replace:**

* **Location:** `projects/admin/src/app/points/point-list.component.ts` - replace the entire file with:
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { FixedMoneyPipe, Labels, type PointMoneyRow } from '@bikerental/shared';
import { POINT_STATUS_CLASSES, POINT_STATUS_LABELS } from './point-status';

@Component({
  selector: 'app-point-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, FixedMoneyPipe],
  template: `
    <table mat-table [dataSource]="rows()" class="w-full">
      <ng-container matColumnDef="point">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointColumnPoint }}</th>
        <td mat-cell *matCellDef="let row">
          <div class="font-medium text-slate-800">{{ row.name }}</div>
          <div class="text-xs text-slate-500 font-mono">{{ row.slug }}</div>
        </td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointColumnStatus }}</th>
        <td mat-cell *matCellDef="let row">
          <span
            class="px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
            [class]="statusClasses[row.status]"
          >
            {{ statusLabels[row.status] }}
          </span>
        </td>
      </ng-container>
      <ng-container matColumnDef="cash">
        <th mat-header-cell *matHeaderCellDef class="!text-right">{{ labels.PointColumnCash }}</th>
        <td mat-cell *matCellDef="let row" class="!text-right tabular-nums whitespace-nowrap">
          {{ row.cash | fixedMoney }}
        </td>
      </ng-container>
      <ng-container matColumnDef="terminal">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointColumnTerminal }}
        </th>
        <td mat-cell *matCellDef="let row" class="!text-right tabular-nums whitespace-nowrap">
          {{ row.terminal | fixedMoney }}
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr
        mat-row
        *matRowDef="let row; columns: columns"
        class="cursor-pointer hover:bg-slate-50"
        tabindex="0"
        (click)="rowOpen.emit(row.slug)"
        (keydown.enter)="rowOpen.emit(row.slug)"
      ></tr>
    </table>
  `,
})
export class PointListComponent {
  protected readonly labels = Labels;
  protected readonly statusLabels = POINT_STATUS_LABELS;
  protected readonly statusClasses = POINT_STATUS_CLASSES;
  protected readonly columns = ['point', 'status', 'cash', 'terminal'];

  readonly rows = input.required<readonly PointMoneyRow[]>();

  readonly rowOpen = output<string>();
}
```

* **Location:** `projects/admin/src/app/points/points-page.component.ts` - replace the entire file with:
* **Snippet:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  Labels,
  PointAdminStore,
  PointListViewStore,
  PointMoneyOverviewStore,
  pointsClosedHidden,
  TimeStore,
} from '@bikerental/shared';
import {
  PointCreateDialogComponent,
  type PointCreateDialogResult,
} from './point-create-dialog.component';
import { PointListComponent } from './point-list.component';
import { PointMoneySummaryCardsComponent } from './point-money-summary-cards.component';

@Component({
  selector: 'app-points-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule,
    PointListComponent,
    PointMoneySummaryCardsComponent,
  ],
  providers: [PointAdminStore, PointMoneyOverviewStore, PointListViewStore],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-slate-800 m-0">{{ labels.Points }}</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          <span>{{ labels.PointNew }}</span>
        </button>
      </div>

      <app-point-money-summary-cards [summary]="view.summary()" />

      <div class="flex items-center gap-4">
        <mat-checkbox
          [checked]="view.showClosed()"
          (change)="view.setShowClosed($event.checked)"
        >
          {{ labels.PointShowClosed }}
        </mat-checkbox>
        @if (view.hiddenClosedCount() > 0) {
          <span class="text-sm text-slate-500">{{ closedHiddenText() }}</span>
        }
      </div>

      @if (view.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (view.registryFailed()) {
        <p class="text-slate-400 text-center mt-8">{{ labels.PointsLoadFailed }}</p>
      } @else if (!view.loading() && view.rows().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ labels.PointsEmpty }}</p>
      } @else {
        <app-point-list [rows]="view.visibleRows()" (rowOpen)="openPoint($event)" />
      }
    </div>
  `,
})
export class PointsPageComponent implements OnInit {
  protected readonly labels = Labels;
  protected readonly view = inject(PointListViewStore);

  private readonly time = inject(TimeStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly closedHiddenText = computed(() =>
    pointsClosedHidden(this.view.hiddenClosedCount()),
  );

  ngOnInit(): void {
    this.view.load(this.time.getCurrentDate());
  }

  protected openPoint(slug: string): void {
    this.router.navigate(['/points', slug]);
  }

  protected openCreateDialog(): void {
    this.dialog
      .open<PointCreateDialogComponent, unknown, PointCreateDialogResult>(
        PointCreateDialogComponent,
        { width: '56rem', maxWidth: '95vw' },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.router.navigate(['/points', result.slug, 'profile']);
      });
  }
}
```

* **Location:** Delete `projects/admin/src/app/points/point-detail.component.ts` and
  `projects/admin/src/app/points/point-detail.component.html` (nothing imports them after the page
  rewrite above).

* **Location:** `projects/shared/src/shared/constant/labels.ts` - delete exactly these two lines
  (they are now unused anywhere in `projects/`):
* **Snippet (lines to delete):**

```typescript
  static readonly PointListLabel = $localize`Rental points list`;
  static readonly PointSelectHint = $localize`Select a rental point or create a new one`;
```

Before deleting, confirm they are unused: search `projects/` for `PointListLabel` and
`PointSelectHint`; the only hits must be the two lines above in `labels.ts`. If any other hit
remains, stop and report it.

Behaviour encoded here (do not change):
* Three requests per visit (registry, positions, results) issued by `PointListViewStore.load()`;
  the checkbox only filters client-side and never refetches.
* "Closed hidden: N" is shown only when N > 0 (it is 0 while the checkbox is on).
* Empty state "No rental points yet" only when the registry returned zero points; registry failure
  shows "Rental points could not be loaded" (the global interceptor has already toasted).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-list.component.ts projects/admin/src/app/points/points-page.component.ts projects/shared/src/shared/constant/labels.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint admin
npx ng lint shared
```
