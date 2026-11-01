import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BusinessPeriod,
  FixedMoneyPipe,
  Labels,
  PointAdminStore,
  PointMoneyRefreshFacade,
  PointResultsStore,
  TimeStore,
} from '@bikerental/shared';
import { PointPeriodFilterComponent } from './point-period-filter.component';

@Component({
  selector: 'app-point-results-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointResultsStore],
  imports: [FixedMoneyPipe, MatProgressBarModule, PointPeriodFilterComponent],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      @if (results.period(); as period) {
        <app-point-period-filter [period]="period" (periodChange)="results.setPeriod($event)" />
      }

      @if (results.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (results.failed()) {
        <p class="text-slate-400 text-center mt-8">{{ labels.PointResultsLoadFailed }}</p>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          @for (figure of results.figures(); track figure.id) {
            <div
              class="p-4 border rounded-lg bg-white"
              [class.border-slate-200]="!figure.emphasis"
              [class.border-green-600]="figure.emphasis"
            >
              <div class="text-sm text-slate-500">{{ figure.label }}</div>
              <div class="text-2xl font-semibold text-slate-800 tabular-nums">
                {{ figure.amount | fixedMoney: figure.id === 'corrections' }}
              </div>
              @if (figure.hint) {
                <div class="text-xs text-slate-500 mt-1">{{ figure.hint }}</div>
              }
            </div>
          }
        </div>
        @if (results.figures().length) {
          <p class="text-xs text-slate-500">{{ labels.PointResultTransfersHint }}</p>
        }
      }
    </div>
  `,
})
export class PointResultsTabComponent {
  protected readonly labels = Labels;
  protected readonly results = inject(PointResultsStore);

  private readonly points = inject(PointAdminStore);
  private readonly facade = inject(PointMoneyRefreshFacade);
  private readonly time = inject(TimeStore);
  private seenRevision = this.facade.revision();

  constructor() {
    effect(() => {
      const slug = this.points.selected()?.slug;
      if (!slug) return;
      untracked(() =>
        this.results.configure(slug, BusinessPeriod.currentMonthToDate(this.time.getCurrentDate())),
      );
    });
    effect(() => {
      const revision = this.facade.revision();
      if (revision === this.seenRevision) return;
      this.seenRevision = revision;
      untracked(() => this.results.reload());
    });
  }
}
