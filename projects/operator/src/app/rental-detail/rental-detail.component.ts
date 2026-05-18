import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  Labels,
  mapRentalStatus,
  RentalStore,
} from '@bikerental/shared';

@Component({
  selector: 'app-rental-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore, CustomerFinanceStore, BatchRentalPropertyStore],
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <button mat-icon-button (click)="onBack()" [attr.aria-label]="Labels.GoBack">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-lg font-semibold text-slate-800">
          {{ Labels.RentalPrefix }}{{ rentalId() }}
        </h1>
        <span [class]="statusBadgeClasses()">{{ statusLabel() }}</span>
      </div>

      @if (store.isActive() && store.isOverdue()) {
        <div
          class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm shrink-0"
        >
          <mat-icon class="!text-base">warning_amber</mat-icon>
          <span>
            {{ Labels.OverdueBy }} {{ store.overdueMinutes() }} {{ Labels.MinuteShort }}
            @if (store.expectedReturnAt(); as returnAt) {
              &nbsp;&middot;&nbsp;{{ Labels.Expected }} {{ returnAt | date: 'HH:mm' }}
            }
          </span>
        </div>
      }

      @if (store.isDebt()) {
        <div
          class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm shrink-0"
        >
          <mat-icon class="!text-base">warning_amber</mat-icon>
          <span>
            @if (store.debtAmount(); as debt) {
              {{ debt.amount }}&nbsp;{{ debt.currency }}&nbsp;&middot;&nbsp;
            }
            {{ Labels.DebtAutoCharge }}
          </span>
        </div>
      }

      @if (store.isLoading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40" />
        </div>
      } @else if (store.loadError()) {
        <div class="flex flex-col items-center gap-4 py-8 px-4">
          <p class="text-slate-500 text-sm">{{ Labels.CustomerRentalDetailLoadError }}</p>
          <button mat-button (click)="store.loadDetail(rentalId())">{{ Labels.Retry }}</button>
        </div>
      } @else if (store.id() !== null) {
        <div class="flex-1 overflow-y-auto"></div>
      }
    </div>
  `,
})
export class RentalDetailComponent {
  protected readonly store = inject(RentalStore);
  private readonly location = inject(Location);

  readonly id = input.required<string>();

  readonly rentalId = computed(() => Number(this.id()));

  protected readonly Labels = Labels;

  readonly statusBadgeClasses = computed(
    () =>
      `text-xs font-medium px-2 py-1 rounded-full ${mapRentalStatus(this.store.status()).badgeClasses}`,
  );

  readonly statusLabel = computed(() => mapRentalStatus(this.store.status()).label);

  constructor() {
    effect(() => {
      const id = this.rentalId();
      if (!isNaN(id) && id > 0) {
        this.store.loadDetail(id);
      }
    });
  }

  protected onBack(): void {
    this.location.back();
  }
}
