import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import type { PenaltyStatus } from '@ui-models';
import {
  DamageReportStore,
  DeployedPath,
  Labels,
  LocalTimestampPipe,
  MoneyPipe,
  parseDate,
  PenaltyStatusBadgeComponent,
  toIsoDate,
} from '@bikerental/shared';
import {
  DamageReportFilterComponent,
  DamageReportFilterValue,
} from './damage-report-filter.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-damage-report-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DamageReportStore],
  imports: [
    LocalTimestampPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    MoneyPipe,
    PenaltyStatusBadgeComponent,
    DamageReportFilterComponent,
    RouterLink,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.DamageReportsListTitle }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-damage-report-filter [value]="filterValue()" (filterChange)="onFilterChange($event)" />

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (store.error()) {
          <div class="text-center mt-6 flex flex-col items-center gap-2">
            <p class="text-slate-500">{{ Labels.DamageReportsLoadError }}</p>
            <button mat-stroked-button (click)="store.reload()">{{ Labels.Retry }}</button>
          </div>
        } @else if (!store.loading() && store.items().length === 0) {
          <p class="text-sm text-slate-400 py-8 text-center">
            {{ Labels.DamageReportsEmptyState }}
          </p>
        } @else {
          <table mat-table [dataSource]="store.items()" class="w-full">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.DamageReportColumnId }}</th>
              <td mat-cell *matCellDef="let row">#{{ row.id }}</td>
            </ng-container>

            <ng-container matColumnDef="reportedAt">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.DamageReportColumnReportedAt }}</th>
              <td mat-cell *matCellDef="let row">
                {{ row.reportedAt | localTimestamp }}
              </td>
            </ng-container>

            <ng-container matColumnDef="rental">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.DamageReportColumnRental }}</th>
              <td mat-cell *matCellDef="let row">
                @if (rentalLink(row.rentalId); as link) {
                  <a [routerLink]="link" class="text-emerald-700 font-medium no-underline">
                    #{{ row.rentalId }}
                  </a>
                } @else {
                  <span class="text-slate-400">—</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.DamageReportColumnCustomer }}</th>
              <td mat-cell *matCellDef="let row">
                @if (store.customer(row.customerId); as customer) {
                  <a
                    [href]="customerUrl(customer.id)"
                    class="text-emerald-700 font-medium no-underline"
                  >
                    {{ customer.phone }}
                    @if (customer.name) {
                      <span class="font-normal text-slate-500">({{ customer.name }})</span>
                    }
                  </a>
                } @else {
                  <span class="text-slate-400">—</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.DamageReportColumnDescription }}</th>
              <td mat-cell *matCellDef="let row" class="max-w-80 truncate">
                {{ row.description }}
              </td>
            </ng-container>

            <ng-container matColumnDef="penaltyAmount">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.DamageReportColumnPenalty }}</th>
              <td mat-cell *matCellDef="let row">
                {{ row.penalty ? (row.penalty.amount | money) : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="penaltyStatus">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.DamageReportColumnStatus }}</th>
              <td mat-cell *matCellDef="let row">
                @if (row.penalty) {
                  <app-penalty-status-badge [status]="row.penalty.status" />
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="view">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button [routerLink]="['/damage-reports', row.id]">
                  <mat-icon>chevron_right</mat-icon>
                </a>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        }

        <mat-paginator
          [length]="store.totalItems()"
          [pageIndex]="store.pageIndex()"
          [pageSize]="store.pageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        />
      </mat-card-content>
    </mat-card>
  `,
})
export class DamageReportHistoryComponent {
  readonly store = inject(DamageReportStore);

  protected readonly Labels = Labels;

  protected readonly displayedColumns = [
    'id',
    'reportedAt',
    'rental',
    'customer',
    'description',
    'penaltyAmount',
    'penaltyStatus',
    'view',
  ];

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected rentalLink(rentalId: number | undefined): unknown[] | null {
    return rentalId ? ['/rentals', rentalId] : null;
  }

  protected customerUrl(customerId: string): string {
    return DeployedPath.fromBase(this.document.baseURI)
      .withRoute(`customers/${customerId}`)
      .toString();
  }

  protected readonly equipmentId = computed(() => {
    const value = Number(this.params()['equipmentId']);
    return Number.isInteger(value) && value > 0 ? value : undefined;
  });
  protected readonly rentalId = computed(() => {
    const value = Number(this.params()['rentalId']);
    return Number.isInteger(value) && value > 0 ? value : undefined;
  });
  protected readonly customerId = computed(() => this.params()['customerId'] || undefined);
  protected readonly penaltyStatus = computed(
    () => (this.params()['penaltyStatus'] as PenaltyStatus | undefined) || undefined,
  );
  protected readonly from = computed(() => parseDate(this.params()['from']) ?? undefined);
  protected readonly to = computed(() => parseDate(this.params()['to']) ?? undefined);
  protected readonly page = computed(() => {
    const value = Number(this.params()['page']);
    return Number.isInteger(value) && value >= 0 ? value : 0;
  });
  protected readonly size = computed(() => {
    const value = Number(this.params()['size']);
    return Number.isInteger(value) && value > 0 ? value : PAGE_SIZE;
  });

  protected readonly filterValue = computed<DamageReportFilterValue>(() => ({
    equipmentId: this.equipmentId(),
    rentalId: this.rentalId(),
    customerId: this.customerId(),
    penaltyStatus: this.penaltyStatus(),
    from: this.from(),
    to: this.to(),
  }));

  constructor() {
    effect(() => {
      this.store.search({
        equipmentId: this.equipmentId(),
        rentalId: this.rentalId(),
        customerId: this.customerId(),
        penaltyStatus: this.penaltyStatus(),
        from: this.from(),
        to: this.to(),
        pageIndex: this.page(),
        pageSize: this.size(),
        withCustomer: true,
      });
    });
  }

  protected onFilterChange(value: DamageReportFilterValue): void {
    this.updateUrl(
      {
        equipmentId: value.equipmentId ?? null,
        rentalId: value.rentalId ?? null,
        customerId: value.customerId ?? null,
        penaltyStatus: value.penaltyStatus ?? null,
        from: value.from ? toIsoDate(value.from) : null,
        to: value.to ? toIsoDate(value.to) : null,
        page: null,
      },
      true,
    );
  }

  protected onPageChange(event: PageEvent): void {
    this.updateUrl(
      {
        page: event.pageIndex === 0 ? null : event.pageIndex,
        size: event.pageSize === PAGE_SIZE ? null : event.pageSize,
      },
      false,
    );
  }

  private updateUrl(queryParams: Params, replaceUrl: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
