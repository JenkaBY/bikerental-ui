import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  CurrentPointStore,
  Labels,
  NotificationService,
  OperatingScopeStore,
  PointMoneyActionAvailability,
  RunningShiftStore,
} from '@bikerental/shared';
import { OperatorShiftCardComponent } from './operator-shift-card.component';

@Component({
  selector: 'app-operator-cash',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RunningShiftStore],
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, OperatorShiftCardComponent],
  template: `
    @if (!hasWorkingPoint()) {
      <div class="flex flex-col items-center gap-2 py-12 text-center text-slate-500" role="status">
        <mat-icon>location_off</mat-icon>
        <p class="m-0">{{ labels.NoWorkingPoint }}</p>
      </div>
    } @else {
      @switch (shiftStore.state()) {
        @case ('loading') {
          <mat-progress-bar mode="indeterminate" />
        }
        @case ('running') {
          @if (shiftStore.shift(); as shift) {
            <app-operator-shift-card
              [shift]="shift"
              [collection]="collection()"
              [closeShift]="closeShift()"
              (handIn)="onHandIn()"
              (closeShiftRequested)="onCloseShift()"
            />
          }
        }
        @case ('none') {
          <p class="m-0 py-12 text-center text-slate-400">{{ labels.PointShiftNone }}</p>
        }
        @case ('failed') {
          <div class="flex flex-col items-center gap-4 py-12 text-center">
            <p class="m-0 text-slate-400">{{ labels.PointShiftLoadFailed }}</p>
            <button mat-stroked-button type="button" class="!h-12" (click)="onRetry()">
              {{ labels.Retry }}
            </button>
          </div>
        }
      }
    }
  `,
})
export class OperatorCashComponent {
  protected readonly labels = Labels;
  protected readonly shiftStore = inject(RunningShiftStore);

  private readonly points = inject(CurrentPointStore);
  private readonly scope = inject(OperatingScopeStore);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly hasWorkingPoint = computed(
    () => !this.scope.notEstablished() && this.points.currentSlug() !== null,
  );
  protected readonly collection = computed(() =>
    PointMoneyActionAvailability.collection(
      this.points.current()?.status ?? null,
      this.shiftStore.shift()?.expectedCash ?? null,
      this.shiftStore.state(),
    ),
  );
  protected readonly closeShift = computed(() =>
    PointMoneyActionAvailability.closeShift(this.shiftStore.state()),
  );

  constructor() {
    effect(() => {
      if (!this.hasWorkingPoint()) return;
      untracked(() => {
        this.shiftStore.load(null);
        this.points.refreshCurrent().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      });
    });
  }

  protected onRetry(): void {
    this.shiftStore.load(null);
  }

  protected onHandIn(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }

  protected onCloseShift(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }
}
