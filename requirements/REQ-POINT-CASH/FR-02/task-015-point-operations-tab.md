# Task 015: PointOperationsTabComponent (position selector, period, order, paged table)

> **Applied Skill:** `angular-component` - smart tab: provides its own `PointMovementsStore`, binds read-only signals. `angular-signals` - `effect()` + `untracked()` to configure from the host's `selectedSlug()` and to reload on the facade `revision`. CLAUDE.md - page index resets to 0 on filter change (inside the store). Design FR-02 §5 step 5 - defaults `{ slug, CASH, current month to date (TimeStore), newest, page 0, size 50 }`.

## 1. Objective

Create the `operations` tab: Cash (default) / Terminal / Bank toggle, period filter, newest /
oldest toggle, progress bar, failure state, movement table (preset `operations`) and paginator.
Changing position, period or order restarts at page 1 (Scenarios 10, 12); an invalid period sends
nothing (Scenario 11); a facade revision reloads with current settings.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-operations-tab.component.ts`
* **Action:** Create New File

## 3. Code Implementation

* **Location:** New file - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BusinessPeriod,
  Labels,
  POINT_MOVEMENT_POSITION_LABELS,
  POINT_MOVEMENT_POSITIONS,
  PointAdminStore,
  PointMoneyRefreshFacade,
  PointMovementsStore,
  TimeStore,
} from '@bikerental/shared';
import { PointMovementTableComponent } from './point-movement-table.component';
import { PointPeriodFilterComponent } from './point-period-filter.component';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-point-operations-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointMovementsStore],
  imports: [
    MatButtonToggleModule,
    MatPaginatorModule,
    MatProgressBarModule,
    PointMovementTableComponent,
    PointPeriodFilterComponent,
  ],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      <div class="flex flex-wrap items-start gap-4">
        <mat-button-toggle-group
          [value]="movements.position()"
          [attr.aria-label]="labels.PointMovementPositionLabel"
          (change)="movements.setPosition($event.value)"
        >
          @for (position of positions; track position) {
            <mat-button-toggle [value]="position">{{ positionLabels[position] }}</mat-button-toggle>
          }
        </mat-button-toggle-group>

        @if (movements.period(); as period) {
          <app-point-period-filter [period]="period" (periodChange)="movements.setPeriod($event)" />
        }

        <mat-button-toggle-group
          [value]="movements.order()"
          [attr.aria-label]="labels.PointMovementOrderLabel"
          (change)="movements.setOrder($event.value)"
        >
          <mat-button-toggle value="newest">{{ labels.PointMovementOrderNewest }}</mat-button-toggle>
          <mat-button-toggle value="oldest">{{ labels.PointMovementOrderOldest }}</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      @if (movements.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (movements.failed()) {
        <p class="text-slate-400 text-center mt-8">{{ labels.PointMovementsLoadFailed }}</p>
      } @else {
        <app-point-movement-table
          [rows]="movements.rows()"
          [preset]="'operations'"
          [emptyText]="labels.PointMovementsEmpty"
        />
        <mat-paginator
          [length]="movements.total()"
          [pageIndex]="movements.pageIndex()"
          [pageSize]="movements.pageSize()"
          [hidePageSize]="true"
          (page)="movements.loadPage($event.pageIndex)"
        />
      }
    </div>
  `,
})
export class PointOperationsTabComponent {
  protected readonly labels = Labels;
  protected readonly positions = POINT_MOVEMENT_POSITIONS;
  protected readonly positionLabels = POINT_MOVEMENT_POSITION_LABELS;
  protected readonly movements = inject(PointMovementsStore);

  private readonly points = inject(PointAdminStore);
  private readonly facade = inject(PointMoneyRefreshFacade);
  private readonly time = inject(TimeStore);
  private seenRevision = this.facade.revision();

  constructor() {
    effect(() => {
      const slug = this.points.selectedSlug();
      if (!slug) return;
      untracked(() =>
        this.movements.configure({
          pointSlug: slug,
          position: 'CASH',
          period: BusinessPeriod.currentMonthToDate(this.time.getCurrentDate()),
          order: 'newest',
          pageSize: PAGE_SIZE,
        }),
      );
    });
    effect(() => {
      const revision = this.facade.revision();
      if (revision === this.seenRevision) return;
      this.seenRevision = revision;
      untracked(() => this.movements.reload());
    });
  }
}
```

Keep the field order: `facade` must be declared before `seenRevision` (field initializers run top
to bottom).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-operations-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
