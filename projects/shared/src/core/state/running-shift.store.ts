import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { PointFinanceService } from '../api/point-finance';
import { ApiErrorParser } from '../errors/api-error.parser';
import { ErrorCode } from '../errors/error-code';
import { ErrorMessageResolver } from '../errors/error-message.resolver';
import { NotificationService } from '../errors/notification.service';
import type { RunningShift, RunningShiftState } from '../models';

interface RunningShiftSnapshot {
  readonly pointSlug: string | null;
  readonly shift: RunningShift | null;
  readonly state: RunningShiftState;
}

@Injectable()
export class RunningShiftStore {
  private readonly finance = inject(PointFinanceService);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _snapshot = signal<RunningShiftSnapshot>({
    pointSlug: null,
    shift: null,
    state: 'loading',
  });

  private target: { readonly pointSlug: string | null } | null = null;
  private subscription: Subscription | null = null;

  readonly pointSlug = computed(() => this._snapshot().pointSlug);
  readonly shift = computed(() => this._snapshot().shift);
  readonly state = computed(() => this._snapshot().state);
  readonly shiftId = computed(() => this._snapshot().shift?.shiftId ?? null);

  load(pointSlug: string | null): void {
    this.target = { pointSlug };
    this._snapshot.set({ pointSlug, shift: null, state: 'loading' });
    this.fetch(pointSlug);
  }

  refresh(): void {
    if (this.target) this.fetch(this.target.pointSlug);
  }

  private fetch(pointSlug: string | null): void {
    this.subscription?.unsubscribe();
    this.subscription = this.finance
      .getCurrentShift(pointSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (shift) =>
          this._snapshot.set({ pointSlug, shift, state: shift ? 'running' : 'none' }),
        error: (err: unknown) => {
          const apiError = ApiErrorParser.parse(err);
          if (apiError.code !== ErrorCode.SCOPE_NOT_ESTABLISHED) {
            this.notifications.error(this.resolver.resolve(apiError));
          }
          this._snapshot.set({ pointSlug, shift: null, state: 'failed' });
        },
      });
  }
}
