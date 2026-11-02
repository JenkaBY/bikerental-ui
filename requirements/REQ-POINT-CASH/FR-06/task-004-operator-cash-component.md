# Task 004: OperatorCashComponent (smart)

> **Applied Skill:** `angular-component` - smart page owns DI and store orchestration. `angular-signals` - `computed` availability, `effect()` + `untracked()` for loads. `angular-di` - `RunningShiftStore` in the component `providers: []` (component-scoped, so every visit and every point switch reloads). CLAUDE.md "UI state in stores" - shift state, busy and failure live in `RunningShiftStore`; the component holds no state signals. AGENTS.md API Error Handling - `RunningShiftStore` already notifies on failure; the refresh of the point status is silent. No positions, movements, results or user directory requests are made.

## 1. Objective

Operator Cash page:

* `hasWorkingPoint = !OperatingScopeStore.notEstablished() && CurrentPointStore.currentSlug() !== null`. Without it: show the existing "No working point assigned" guidance (icon + `Labels.NoWorkingPoint`), send no request, render no button. Because the check is a `computed`, a mid-session `scope.not_established` flips the screen to the guidance automatically.
* With a working point (effect, re-runs when it flips back to true): `RunningShiftStore.load(null)` and, in parallel, `CurrentPointStore.refreshCurrent()` (subscribed with `takeUntilDestroyed`).
* States: `loading` progress bar; `running` the card; `none` `Labels.PointShiftNone` and no buttons; `failed` `Labels.PointShiftLoadFailed` + `Labels.Retry` button (48px) calling `load(null)`.
* Availability: collection = `PointMoneyActionAvailability.collection(points.current()?.status ?? null, shift?.expectedCash ?? null, shiftState)`; closeShift = `PointMoneyActionAvailability.closeShift(shiftState)`.
* Handlers: FR-07 and FR-08 add their routes (`cash/collect`, `cash/close-shift`) later and those routes do not exist yet, so `onHandIn()` and `onCloseShift()` only show the info notification `Labels.PointActionNotAvailableYet` (same interim behaviour as the admin Cash tab). FR-07 / FR-08 replace only the handler bodies with `router.navigate`.

Requires tasks 001, 002, 003.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-cash.component.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** new file, whole content:

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
      <div
        class="flex flex-col items-center gap-2 py-12 text-center text-slate-500"
        role="status"
      >
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
```

If lint reports `takeUntilDestroyed` outside an injection context, it is inside `untracked` in an effect callback but `destroyRef` is passed explicitly, so it is valid; do not remove the argument.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-cash.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
