import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { DurationPipe, Labels, mapRentalStatus } from '@bikerental/shared';
import type { RentalListItem } from '@bikerental/shared';

@Component({
  selector: 'app-rental-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DurationPipe],
  host: {
    '(click)': 'navigateToDetail()',
    class:
      'block cursor-pointer select-none transition-colors duration-200 rounded-lg p-3 shadow-sm border border-transparent bg-white',
    '[class.bg-amber-50]': 'isWarning()',
    '[class.border-l-4]': 'isWarning()',
    '[class.border-l-amber-400]': 'isWarning()',
  },
  template: `
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <span class="font-bold text-slate-900">{{ item().customerPhone }}</span>
        @if (item().customerName) {
          <span class="text-slate-500">&nbsp;({{ item().customerName }})</span>
        }
      </div>
      <span [class]="badgeClasses()" class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full">
        {{ statusLabel() }}
      </span>
    </div>

    @if (variant() === 'active') {
      <div class="mt-1 text-sm font-medium">
        @if (item().isOverdue) {
          <span class="text-amber-600">
            {{ Labels.OverdueBy }} {{ item().overdueMinutes | duration }}
          </span>
        } @else {
          <span class="text-slate-500">
            @if (remainingMinutes(); as mins) {
              {{ mins | duration }} {{ Labels.Remaining }}
            }
            @if (item().expectedReturnAt; as returnAt) {
              @if (remainingMinutes()) {
                &nbsp;&middot;&nbsp;
              }
              {{ returnAt | date: 'HH:mm' }}
            }
          </span>
        }
      </div>
    }

    @if (variant() === 'history') {
      <div class="mt-1 text-sm">
        @if (item().isDebt) {
          <span class="text-amber-600">
            {{ Labels.RentalStatusDebt }}
            @if (item().expectedReturnAt; as endedAt) {
              &nbsp;&middot;&nbsp;{{ Labels.Ended }}&nbsp;{{ endedAt | date: 'HH:mm' }}
            }
          </span>
        } @else {
          <span class="text-slate-500">
            @if (item().expectedReturnAt; as endedAt) {
              {{ Labels.Ended }}&nbsp;{{ endedAt | date: 'HH:mm' }}
            }
          </span>
        }
      </div>
    }

    @if (item().equipmentNames.length > 0) {
      <div class="mt-2 flex flex-wrap gap-1">
        @for (name of item().equipmentNames; track $index) {
          <span class="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700">
            {{ name }}
          </span>
        }
      </div>
    }
  `,
})
export class RentalCardComponent {
  private readonly router = inject(Router);

  readonly item = input.required<RentalListItem>();
  readonly variant = input<'active' | 'history'>('active');
  readonly isWarning = computed(() => this.item().isOverdue || this.item().isDebt);

  protected readonly Labels = Labels;

  readonly statusLabel = computed(() => mapRentalStatus(this.item().status).label);

  readonly badgeClasses = computed(() => mapRentalStatus(this.item().status).badgeClasses);

  readonly remainingMinutes = computed(() => {
    const returnAt = this.item().expectedReturnAt;
    if (!returnAt) {
      return null;
    }

    const returnTime = returnAt instanceof Date ? returnAt.getTime() : new Date(returnAt).getTime();
    const diff = Math.floor((returnTime - Date.now()) / 60_000);

    return diff > 0 ? diff : null;
  });

  protected navigateToDetail(): void {
    if (this.item().status === 'DRAFT') {
      void this.router.navigate(['/rentals', this.item().id, 'edit']);
      return;
    }

    void this.router.navigate(['/rentals', this.item().id]);
  }
}
