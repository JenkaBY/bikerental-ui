import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  BusinessPeriod,
  Labels,
  POINT_MOVEMENT_FILTER_KINDS,
  POINT_MOVEMENT_KIND_LABELS,
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
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
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

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-56">
          <mat-label>{{ labels.PointMovementKindsLabel }}</mat-label>
          <mat-select
            multiple
            [value]="movements.kinds()"
            [placeholder]="labels.PointMovementKindsAll"
            (selectionChange)="movements.setKinds($event.value)"
          >
            @for (kind of kinds; track kind) {
              <mat-option [value]="kind">{{ kindLabels[kind] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-button-toggle-group
          [value]="movements.order()"
          [attr.aria-label]="labels.PointMovementOrderLabel"
          (change)="movements.setOrder($event.value)"
        >
          <mat-button-toggle value="newest">{{
            labels.PointMovementOrderNewest
          }}</mat-button-toggle>
          <mat-button-toggle value="oldest">{{
            labels.PointMovementOrderOldest
          }}</mat-button-toggle>
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
  protected readonly kinds = POINT_MOVEMENT_FILTER_KINDS;
  protected readonly kindLabels = POINT_MOVEMENT_KIND_LABELS;
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
