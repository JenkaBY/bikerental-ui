import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { ReturnableRental } from '@bikerental/shared';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-returnable-rental-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule],
  template: `
    <button
      type="button"
      class="w-full text-left rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-2 hover:bg-slate-50"
      (click)="selected.emit()"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="font-semibold text-slate-800">{{ Labels.RentalPrefix }}{{ rental().id }}</span>
        @if (rental().expectedReturnAt; as returnAt) {
          <span class="text-xs text-slate-500">
            {{ Labels.ExpectedReturn }}: {{ returnAt | date: 'dd.MM HH:mm' }}
          </span>
        }
      </div>

      @if (activeItemUids().length) {
        <div class="flex flex-wrap gap-1">
          @for (uid of activeItemUids(); track uid) {
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{{
              uid
            }}</span>
          }
        </div>
      }

      @if (rental().atThisPoint) {
        <span class="text-xs text-slate-500">{{ Labels.PickedUpAtThisPoint }}</span>
      } @else {
        <div
          class="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-sm text-amber-800"
        >
          <mat-icon class="!text-base !w-4 !h-4 !leading-4 shrink-0">storefront</mat-icon>
          <span>
            {{ Labels.PickedUpAtOtherPoint }}
            <strong>{{ pickUpPointName() }}</strong>
          </span>
        </div>
      }
    </button>
  `,
})
export class ReturnableRentalCardComponent {
  readonly rental = input.required<ReturnableRental>();
  readonly pickUpPointName = input<string | null>(null);

  readonly selected = output<void>();

  protected readonly Labels = Labels;

  protected readonly activeItemUids = computed(() =>
    this.rental()
      .equipmentItems.filter((item) => !item.isReturned)
      .map((item) => item.uid),
  );
}
