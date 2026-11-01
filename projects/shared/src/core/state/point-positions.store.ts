import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, Subscription } from 'rxjs';
import { PointFinanceService, PointLedgerUnavailableNotifier } from '../api/point-finance';
import type { Money, PointPositionKind, PointPositions } from '../models';

@Injectable()
export class PointPositionsStore {
  private readonly finance = inject(PointFinanceService);
  private readonly ledgerNotifier = inject(PointLedgerUnavailableNotifier);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _slug = signal<string | null>(null);
  private readonly _positions = signal<PointPositions | null>(null);
  private readonly _patches = signal<Partial<Record<PointPositionKind, Money>>>({});
  private readonly _loading = signal(false);
  private readonly _failed = signal(false);

  private subscription: Subscription | null = null;

  readonly slug = computed(() => this._slug());
  readonly positions = computed(() => this._positions());
  readonly loading = computed(() => this._loading());
  readonly failed = computed(() => this._failed());
  readonly cash = computed(() => this.amountOf('CASH'));
  readonly cardTerminal = computed(() => this.amountOf('CARD_TERMINAL'));
  readonly bank = computed(() => this.amountOf('BANK'));

  load(slug: string): void {
    this._slug.set(slug);
    this._positions.set(null);
    this._patches.set({});
    this.fetch(slug);
  }

  refresh(): void {
    const slug = this._slug();
    if (slug) this.fetch(slug);
  }

  applyPosition(kind: PointPositionKind, amount: Money): void {
    this._patches.update((patches) => ({ ...patches, [kind]: amount }));
  }

  private fetch(slug: string): void {
    this.subscription?.unsubscribe();
    this._loading.set(true);
    this._failed.set(false);
    this.subscription = this.finance
      .getPositions()
      .pipe(
        map((overview) => overview.points.find((p) => p.pointSlug === slug) ?? null),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (positions) => {
          this._positions.set(positions);
          this._patches.set({});
        },
        error: (err: unknown) => {
          this.ledgerNotifier.notify(err);
          this._positions.set(null);
          this._failed.set(true);
        },
      });
  }

  private amountOf(kind: PointPositionKind): Money | null {
    return this._patches()[kind] ?? this._positions()?.amounts[kind] ?? null;
  }
}
