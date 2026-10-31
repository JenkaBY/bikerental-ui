# Task 009: Rewrite the points table (`PointListComponent`) and list page (`PointsPageComponent`)

> **Applied Skill:** `angular-component` - smart page (DI, stores, router, dialog) vs dumb table (`input()` / `output()`, `OnPush`). `angular-signals` - template reads store `computed()` signals directly; no manual subscriptions except the two `load()` calls closed with `takeUntilDestroyed()`. `angular-routing` - row click navigates by route segments (`['/points', slug]`), never a hand-built URL. AGENTS.md *Admin CRUD Pattern* / Customers list - "New point" raised button in the title row opens a `MatDialog`; navigation on a truthy dialog result.

## 1. Objective

Replace the two-pane master/detail Points page with a full-width list page styled like the Customers list:

* Title row: `Labels.Points` heading + "New point" raised primary button (opens `PointCreateDialogComponent`; on `{ slug }` navigates to `/points/{slug}/profile`).
* Summary cards (`PointMoneySummaryCardsComponent`) fed by `PointMoneyOverviewStore`.
* "Show closed points" checkbox + "Closed hidden: N" counter (rendered only when N > 0; N is already 0 when the checkbox is on).
* Indeterminate progress bar while the registry or money data loads.
* Empty state `Labels.PointsEmpty` when the registry finished loading with zero points; otherwise the table.
* Table columns in order: Point (name + slug beneath), Status pill (existing `POINT_STATUS_LABELS` / `POINT_STATUS_CLASSES`), Cash in drawer, Terminal (both right-aligned, two decimals, em-dash when `null`), Last bank transfer (`dd.MM.yyyy · performer`, em-dash when `null`). Whole row is clickable and emits `rowOpen(slug)`; the page navigates to `/points/{slug}`.

The page provides all feature-scoped stores and the point-money API: `PointAdminStore`, `PointMoneyOverviewStore`, `PointListViewStore`, `providePointMoneyApi()`.

Finally, delete the now-unused `PointDetailComponent` (its form logic lives in `PointProfileFormComponent` since Task 006). `PointStatusActionsComponent` and `point-status.ts` are KEPT (FR-02 relocates the status actions to the Profile tab).

Known interim effect (expected, do not try to fix): until FR-02 adds the `/points/:slug/**` routes, row clicks and the post-create navigation fall through to the admin wildcard route.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-list.component.ts`
* **Action:** Modify Existing File (replace the whole file content)

* **File Path:** `projects/admin/src/app/points/points-page.component.ts`
* **Action:** Modify Existing File (replace the whole file content)

* **File Path:** `projects/admin/src/app/points/point-detail.component.ts`
* **Action:** Delete File

* **File Path:** `projects/admin/src/app/points/point-detail.component.html`
* **Action:** Delete File

## 3. Code Implementation

**Imports Required:** (contained in each snippet below)

**Code to Add/Replace:**

* **Location:** Replace the WHOLE content of `projects/admin/src/app/points/point-list.component.ts`
* **Snippet:**

```typescript
import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Labels, type PointMoneyRow } from '@bikerental/shared';
import { POINT_STATUS_CLASSES, POINT_STATUS_LABELS } from './point-status';

@Component({
  selector: 'app-point-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, DatePipe, DecimalPipe],
  template: `
    <table
      mat-table
      [dataSource]="rows()"
      class="w-full"
      [attr.aria-label]="labels.PointListLabel"
    >
      <ng-container matColumnDef="point">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointsColumnPoint }}</th>
        <td mat-cell *matCellDef="let row">
          <div class="font-medium text-slate-800">{{ row.name }}</div>
          <div class="text-xs text-slate-500 font-mono">{{ row.slug }}</div>
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointsColumnStatus }}</th>
        <td mat-cell *matCellDef="let row">
          <span class="px-2 py-0.5 rounded-full text-xs" [class]="statusClasses[row.status]">
            {{ statusLabels[row.status] }}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="cash">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointsColumnCash }}
        </th>
        <td mat-cell *matCellDef="let row" class="text-right tabular-nums">
          @if (row.cash) {
            {{ row.cash.amount | number: '1.2-2' }}
          } @else {
            —
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="terminal">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointsColumnTerminal }}
        </th>
        <td mat-cell *matCellDef="let row" class="text-right tabular-nums">
          @if (row.terminal) {
            {{ row.terminal.amount | number: '1.2-2' }}
          } @else {
            —
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="lastTransfer">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointsColumnLastTransfer }}</th>
        <td mat-cell *matCellDef="let row">
          @if (row.lastTransfer) {
            {{ row.lastTransfer.transferredAt | date: 'dd.MM.yyyy' }} ·
            {{ row.lastTransfer.performerName }}
          } @else {
            —
          }
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr
        mat-row
        *matRowDef="let row; columns: displayedColumns"
        class="cursor-pointer hover:bg-slate-50"
        (click)="rowOpen.emit(row.slug)"
      ></tr>
    </table>
  `,
})
export class PointListComponent {
  protected readonly labels = Labels;
  protected readonly statusLabels = POINT_STATUS_LABELS;
  protected readonly statusClasses = POINT_STATUS_CLASSES;
  protected readonly displayedColumns = ['point', 'status', 'cash', 'terminal', 'lastTransfer'];

  readonly rows = input.required<PointMoneyRow[]>();

  readonly rowOpen = output<string>();
}
```

* **Location:** Replace the WHOLE content of `projects/admin/src/app/points/points-page.component.ts`
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
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import {
  closedPointsHidden,
  Labels,
  PointAdminStore,
  PointListViewStore,
  PointMoneyOverviewStore,
  providePointMoneyApi,
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
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    PointListComponent,
    PointMoneySummaryCardsComponent,
  ],
  providers: [PointAdminStore, PointMoneyOverviewStore, PointListViewStore, providePointMoneyApi()],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-slate-800 m-0">{{ labels.Points }}</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          <span>{{ labels.PointNew }}</span>
        </button>
      </div>

      <app-point-money-summary-cards
        [cashTotal]="money.cashTotal()"
        [terminalTotal]="money.terminalTotal()"
        [monthSummary]="money.monthSummary()"
        [month]="money.monthRange().from"
      />

      <div class="flex items-center gap-4">
        <mat-checkbox
          [checked]="view.showClosed()"
          (change)="view.setShowClosed($event.checked)"
        >
          {{ labels.PointsShowClosed }}
        </mat-checkbox>
        @if (view.hiddenClosedCount() > 0) {
          <span class="text-sm text-slate-500">{{ hiddenClosedLabel() }}</span>
        }
      </div>

      @if (registry.loading() || money.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (!registry.loading() && registry.points().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ labels.PointsEmpty }}</p>
      } @else {
        <app-point-list [rows]="view.visibleRows()" (rowOpen)="openPoint($event)" />
      }
    </div>
  `,
})
export class PointsPageComponent implements OnInit {
  protected readonly labels = Labels;
  protected readonly registry = inject(PointAdminStore);
  protected readonly money = inject(PointMoneyOverviewStore);
  protected readonly view = inject(PointListViewStore);

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly hiddenClosedLabel = computed(() =>
    closedPointsHidden(this.view.hiddenClosedCount()),
  );

  ngOnInit(): void {
    this.registry.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.money.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected openPoint(slug: string): void {
    this.router.navigate(['/points', slug]);
  }

  protected openCreateDialog(): void {
    this.dialog
      .open<PointCreateDialogComponent, undefined, PointCreateDialogResult>(
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

* **Location:** Delete the files `projects/admin/src/app/points/point-detail.component.ts` and `projects/admin/src/app/points/point-detail.component.html`.
  Before deleting, use the Grep tool with pattern `PointDetailComponent|point-detail\.component` on path `projects` (output mode: files with matches). After the two rewrites above, the ONLY matching file must be `projects/admin/src/app/points/point-detail.component.ts` itself. If any other file matches, STOP and report failure.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
