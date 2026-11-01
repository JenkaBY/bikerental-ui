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
        <mat-checkbox [checked]="view.showClosed()" (change)="view.setShowClosed($event.checked)">
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
