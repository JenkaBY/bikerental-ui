import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ApiErrorParser,
  ErrorCode,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  PageHeaderComponent,
  PointAdminStore,
  PointMoneyRefreshFacade,
  PointPositionsStore,
  SegmentedTabsComponent,
  type SegmentTab,
  StaffNameResolver,
} from '@bikerental/shared';
import { PointBalancePillComponent } from './point-balance-pill.component';
import { POINT_STATUS_CLASSES, POINT_STATUS_LABELS } from './point-status';

@Component({
  selector: 'app-point-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointAdminStore, PointPositionsStore, PointMoneyRefreshFacade, StaffNameResolver],
  imports: [
    RouterOutlet,
    MatProgressBarModule,
    PageHeaderComponent,
    SegmentedTabsComponent,
    PointBalancePillComponent,
  ],
  template: `
    <div class="flex flex-col h-full -mx-4 -mt-4">
      <app-page-header [backLabel]="labels.PointBackButton" (back)="goBack()">
        @if (point(); as p) {
          <div class="flex flex-col flex-1 min-w-0">
            <span class="flex items-center gap-2 min-w-0">
              <span class="font-semibold text-slate-800 truncate">{{ p.name }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-xs shrink-0"
                [class]="statusClasses[p.status]"
              >
                {{ statusLabels[p.status] }}
              </span>
            </span>
            <span class="text-sm text-slate-500 truncate">{{ identity() }}</span>
          </div>
        } @else {
          <mat-progress-bar mode="indeterminate" class="flex-1" />
        }
        <div actions class="flex items-center gap-2">
          <app-point-balance-pill [label]="labels.PointPositionCash" [amount]="positions.cash()" />
          <app-point-balance-pill
            [label]="labels.PointPositionTerminal"
            [amount]="positions.cardTerminal()"
          />
          <app-point-balance-pill [label]="labels.PointPositionBank" [amount]="positions.bank()" />
        </div>
      </app-page-header>

      <app-segmented-tabs [tabs]="tabs" linkMode />

      <div class="flex-1 overflow-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class PointDetailPageComponent {
  protected readonly labels = Labels;
  protected readonly statusLabels = POINT_STATUS_LABELS;
  protected readonly statusClasses = POINT_STATUS_CLASSES;
  protected readonly tabs: SegmentTab[] = [
    { id: 'profile', label: Labels.PointTabProfile },
    { id: 'cash', label: Labels.PointTabCash },
    { id: 'transfers', label: Labels.PointTabTransfers },
    { id: 'operations', label: Labels.PointTabOperations },
    { id: 'results', label: Labels.PointTabResults },
  ];

  readonly slug = input.required<string>();

  protected readonly positions = inject(PointPositionsStore);
  private readonly points = inject(PointAdminStore);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly point = this.points.selected;

  protected readonly identity = computed(() => {
    const p = this.point();
    if (!p) return '';
    return `${p.address.street}, ${p.address.city}, ${p.address.country} · ${p.slug}`;
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => this.open(slug));
    });
  }

  protected goBack(): void {
    this.router.navigate(['/points']);
  }

  private open(slug: string): void {
    this.positions.load(slug);
    this.points
      .loadOne(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: (err) => this.handleLoadError(err) });
  }

  private handleLoadError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    if (apiError.status === 404 || apiError.code === ErrorCode.RESOURCE_NOT_FOUND) {
      this.notifications.warn(Labels.PointNotFound);
      this.router.navigate(['/points']);
      return;
    }
    this.notifications.error(this.resolver.resolve(apiError));
  }
}
