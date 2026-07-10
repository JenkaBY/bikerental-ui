import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  CustomerCommentsListComponent,
  CustomerPanelHeaderComponent,
  CustomerRatingService,
  Labels,
  RENTAL_STORE_TOKEN,
  TopUpButtonComponent,
  WithdrawButtonComponent,
} from '@bikerental/shared';

@Component({
  selector: 'app-rental-customer-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    TopUpButtonComponent,
    WithdrawButtonComponent,
    CustomerPanelHeaderComponent,
    CustomerCommentsListComponent,
  ],
  template: `
    <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <app-customer-panel-header
        [customer]="store.customer()"
        [balance]="store.customerBalance()"
        [rating]="rating()"
        [balanceSufficient]="store.isBalanceSufficient()"
        [expanded]="expanded()"
        (toggled)="toggleExpanded()"
      />

      @if (expanded()) {
        <div class="px-4 pb-4 flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-2 [&_button]:w-full">
            <app-withdraw-button
              (confirm)="withdrawRequested.emit()"
              [disabled]="!store.customerBalance()?.isWithdrawalAvailable"
            />
            <app-top-up-button (confirm)="topUpRequested.emit()" />
          </div>

          <app-customer-comments-list [comments]="comments()" />

          <button
            type="button"
            matButton
            class="self-stretch text-emerald-700"
            (click)="openProfileRequested.emit()"
          >
            {{ Labels.CustomerOpenProfile }}
            <mat-icon iconPositionEnd aria-hidden="true">north_east</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class RentalCustomerPanelComponent {
  protected readonly store = inject(RENTAL_STORE_TOKEN);
  private readonly ratingService = inject(CustomerRatingService);
  protected readonly Labels = Labels;

  readonly topUpRequested = output<void>();
  readonly withdrawRequested = output<void>();
  readonly openProfileRequested = output<void>();

  protected readonly expanded = signal(false);

  protected readonly rating = computed(() => {
    const id = this.store.customer()?.id;
    return id ? this.ratingService.getRating(id) : null;
  });

  protected readonly comments = computed(() =>
    (this.store.customer()?.notes ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }
}
