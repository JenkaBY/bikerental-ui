import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { Customer, RentalStore } from '@bikerental/shared';
import { CustomerSearchInputComponent } from './customer-search-input.component';

@Component({
  selector: 'app-rental-step1',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomerSearchInputComponent],
  template: `
    <app-customer-search-input
      [initialPhone]="initialPhone()"
      (customerSelected)="onCustomerSelected($event)"
    />
  `,
})
export class RentalStep1Component {
  private readonly store = inject(RentalStore);

  readonly customerSelected = output<void>();

  protected readonly initialPhone = computed(() => this.store.customer()?.phone ?? '');

  protected onCustomerSelected(customer: Customer): void {
    // Search results omit notes/comments; hydrate the full profile so the
    // panel shows the same data as when a draft rental is loaded for edit.
    this.store.setCustomer(customer, { hydrateNotes: true });
    this.customerSelected.emit();
  }
}
