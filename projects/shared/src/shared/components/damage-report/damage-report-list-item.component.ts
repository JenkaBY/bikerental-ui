import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import type { DamageReportListItem } from '../../../core/models/damage-report.model';
import { Labels } from '../../constant/labels';
import { MoneyPipe } from '../../pipes/money.pipe';
import { PenaltyStatusBadgeComponent } from '../penalty-status-badge/penalty-status-badge.component';

@Component({
  selector: 'app-damage-report-list-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, MoneyPipe, PenaltyStatusBadgeComponent, RouterLink],
  template: `
    @if (report(); as r) {
      <a
        [routerLink]="['/damage-reports', r.id]"
        class="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 no-underline"
      >
        <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">build</mat-icon>
        <span class="flex flex-col min-w-0 flex-1">
          <span class="text-sm text-slate-700 truncate"
            >{{ Labels.DamageReportPrefix }}{{ r.id }}</span
          >
          <span class="text-xs text-slate-400 flex items-center gap-1 flex-wrap">
            <span>{{ r.reportedAt | date: 'dd.MM.yyyy HH:mm' }}</span>
            <span>·</span>
            <span class="truncate">{{ r.description }}</span>
          </span>
        </span>
        @if (r.penalty; as penalty) {
          <span class="flex flex-col items-end gap-1 shrink-0">
            <span class="text-sm font-semibold text-slate-700 whitespace-nowrap">{{
              penalty.amount | money
            }}</span>
            <app-penalty-status-badge [status]="penalty.status" />
          </span>
        }
        <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">chevron_right</mat-icon>
      </a>
    }
  `,
})
export class DamageReportListItemComponent {
  readonly report = input.required<DamageReportListItem>();

  protected readonly Labels = Labels;
}
