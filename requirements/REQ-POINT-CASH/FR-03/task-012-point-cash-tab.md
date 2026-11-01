# Task 012: PointCashTabComponent (smart) - replaces the FR-02 shell

> **Applied Skill:** `angular-component` - smart tab owns DI and store orchestration, cards are dumb. `angular-signals` - `computed` availability, `effect()` + `untracked()` for store loads (same pattern as `PointOperationsTabComponent`). `angular-di` - feature stores in the component `providers: []`; host stores (`PointAdminStore`, `PointPositionsStore`, `PointMoneyRefreshFacade`, `StaffNameResolver`) come from `PointDetailPageComponent`. CLAUDE.md "UI state in stores" - "Show more" state lives in `PointMovementsStore`. AGENTS.md API Error Handling - `ApiErrorParser` + `ErrorMessageResolver` + `NotificationService`. The route `cash` already exists in `point-detail.routes.ts` - do not touch it.

## 1. Objective

Replace the empty shell with the Cash tab:

* tab-scoped `RunningShiftStore` and `PointMovementsStore`; `RunningShiftStore.load(slug)` on entry;
* once the shift id is known (and again when a closure creates a new shift), configure the movement
  store `{ slug, CASH, [day of openedAt ... today], newest, size 100, notBefore: openedAt, accumulate: true }`;
* on a new `PointMoneyRefreshFacade` revision: `RunningShiftStore.refresh()` + `PointMovementsStore.reload()`;
* availability for the three buttons; interim collection amount = CASH position, falling back to
  `shift.expectedCash` while positions are unavailable;
* shift movement list (`preset 'shift'`), "Show more" while `hasMore()`, hidden unless a shift runs;
* handlers `onCollect` / `onCloseShift` / `onSettle` are wired to the cards. The FR-05 dialogs and
  the FR-08 closure dialog do not exist yet, so for now each handler shows the info notification
  "This action is not available yet"; FR-05 / FR-08 replace the handler bodies with the dialog
  open + `applyOutcome(result?.outcome)`;
* `applyOutcome(outcome)` (already complete): `PointMoneyRefreshFacade.notifyChanged()` (refreshes
  positions + header pills and triggers the shift and list reload through the revision effect) and,
  for `'statusChanged'`, `PointAdminStore.loadOne(slug)` so the buttons follow the new point status.
  It is `protected` and has no caller yet on purpose (an unused `private` member fails the build).

Requires tasks 004, 005, 006, 007, 008, 010, 011.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-cash-tab.component.ts` - **Action:** Modify Existing File (replace whole content)

## 3. Code Implementation

* **Location:** `projects/admin/src/app/points/point-cash-tab.component.ts` - replace the whole file content.
* **Snippet:**

```typescript
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ApiErrorParser,
  BusinessPeriod,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  PointAdminStore,
  PointMoneyActionAvailability,
  PointMoneyRefreshFacade,
  PointMovementsStore,
  PointPositionsStore,
  RunningShiftStore,
  TimeStore,
} from '@bikerental/shared';
import { PointCashCardComponent } from './point-cash-card.component';
import { PointMovementTableComponent } from './point-movement-table.component';
import { PointTerminalCardComponent } from './point-terminal-card.component';

const PAGE_SIZE = 100;

type MoneyDialogOutcome = 'done' | 'statusChanged' | 'shiftChanged';

@Component({
  selector: 'app-point-cash-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RunningShiftStore, PointMovementsStore],
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    PointCashCardComponent,
    PointTerminalCardComponent,
    PointMovementTableComponent,
  ],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      <div class="grid gap-4 md:grid-cols-2">
        <app-point-cash-card
          [cash]="positions.cash()"
          [shift]="shiftStore.shift()"
          [shiftState]="shiftStore.state()"
          [collection]="collection()"
          [closeShift]="closeShift()"
          (collect)="onCollect()"
          (closeShiftRequested)="onCloseShift()"
        />
        <app-point-terminal-card
          [terminal]="positions.cardTerminal()"
          [settlement]="settlement()"
          (settle)="onSettle()"
        />
      </div>

      @if (shiftStore.state() === 'running') {
        <section class="flex flex-col gap-2">
          <h2 class="m-0 text-base font-semibold text-slate-700">
            {{ labels.PointShiftMovementsTitle }}
          </h2>
          @if (movements.loading()) {
            <mat-progress-bar mode="indeterminate" />
          }
          @if (movements.failed()) {
            <p class="text-slate-400 text-center mt-8">{{ labels.PointMovementsLoadFailed }}</p>
          } @else {
            <app-point-movement-table
              [rows]="movements.rows()"
              [preset]="'shift'"
              [emptyText]="labels.PointShiftMovementsEmpty"
            />
            @if (movements.hasMore()) {
              <div class="flex justify-center">
                <button
                  mat-stroked-button
                  type="button"
                  [disabled]="movements.loading()"
                  (click)="movements.loadMore()"
                >
                  {{ labels.ShowMore }}
                </button>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
})
export class PointCashTabComponent {
  protected readonly labels = Labels;
  protected readonly shiftStore = inject(RunningShiftStore);
  protected readonly movements = inject(PointMovementsStore);
  protected readonly positions = inject(PointPositionsStore);

  private readonly points = inject(PointAdminStore);
  private readonly facade = inject(PointMoneyRefreshFacade);
  private readonly time = inject(TimeStore);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);
  private seenRevision = this.facade.revision();

  protected readonly cashAmount = computed(
    () => this.positions.cash() ?? this.shiftStore.shift()?.expectedCash ?? null,
  );
  protected readonly collection = computed(() =>
    PointMoneyActionAvailability.collection(
      this.points.selected()?.status ?? null,
      this.cashAmount(),
      this.shiftStore.state(),
    ),
  );
  protected readonly settlement = computed(() =>
    PointMoneyActionAvailability.settlement(
      this.points.selected()?.status ?? null,
      this.positions.cardTerminal(),
    ),
  );
  protected readonly closeShift = computed(() =>
    PointMoneyActionAvailability.closeShift(this.shiftStore.state()),
  );

  constructor() {
    effect(() => {
      const slug = this.points.selectedSlug();
      if (!slug) return;
      untracked(() => this.shiftStore.load(slug));
    });
    effect(() => {
      if (!this.shiftStore.shiftId()) return;
      untracked(() => this.configureMovements());
    });
    effect(() => {
      const revision = this.facade.revision();
      if (revision === this.seenRevision) return;
      this.seenRevision = revision;
      untracked(() => {
        this.shiftStore.refresh();
        this.movements.reload();
      });
    });
  }

  protected onCollect(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }

  protected onCloseShift(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }

  protected onSettle(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }

  protected applyOutcome(outcome: MoneyDialogOutcome | undefined): void {
    if (!outcome) return;
    this.facade.notifyChanged();
    const slug = this.points.selectedSlug();
    if (outcome !== 'statusChanged' || !slug) return;
    this.points
      .loadOne(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: unknown) =>
          this.notifications.error(this.resolver.resolve(ApiErrorParser.parse(err))),
      });
  }

  private configureMovements(): void {
    const slug = this.points.selectedSlug();
    const shift = this.shiftStore.shift();
    if (!slug || !shift) return;
    this.movements.configure({
      pointSlug: slug,
      position: 'CASH',
      period: BusinessPeriod.sinceDayOf(shift.openedAt, this.time.getCurrentDate()),
      order: 'newest',
      pageSize: PAGE_SIZE,
      notBefore: shift.openedAt,
      accumulate: true,
    });
  }
}
```

The file is about 190 lines of TS; do not split or refactor it. If lint reports a size problem,
stop and report it.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-cash-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
