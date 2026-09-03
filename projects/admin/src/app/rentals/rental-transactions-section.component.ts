import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  CardStackComponent,
  CollapsibleSectionComponent,
  Labels,
  RentalStore,
  RentalTransactionsStore,
  TransactionListItemComponent,
} from '@bikerental/shared';

@Component({
  selector: 'app-rental-transactions-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    CardStackComponent,
    CollapsibleSectionComponent,
    TransactionListItemComponent,
  ],
  template: `
    <app-collapsible-section
      [title]="Labels.RentalTransactionsTitle"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      [emptyMessage]="Labels.RentalTransactionsEmpty"
    >
      <a
        actions
        mat-icon-button
        class="icon-btn-sm"
        [routerLink]="'/transactions'"
        [queryParams]="queryParams()"
        [attr.aria-label]="Labels.OpenTransactionsList"
        [title]="Labels.OpenTransactionsList"
      >
        <mat-icon class="!text-base">open_in_new</mat-icon>
      </a>
      <app-card-stack variant="inset">
        @for (t of store.transactions(); track $index) {
          <app-transaction-list-item [transaction]="t" [showBalances]="true" />
        }
      </app-card-stack>
    </app-collapsible-section>
  `,
})
export class RentalTransactionsSectionComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalTransactionsStore);

  private readonly rentalStore = inject(RentalStore);

  protected readonly queryParams = computed(() => ({
    sourceId: String(this.rentalStore.id() ?? ''),
  }));

  protected readonly isEmpty = computed(
    () => !this.store.loading() && this.store.transactions().length === 0,
  );
}
