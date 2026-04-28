import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CustomerEditComponent,
  CustomerStore,
  CustomerViewComponent,
  CustomerWrite,
  Labels,
} from '@bikerental/shared';
import { CustomerLayoutStore } from '../../customer-layout.store';

@Component({
  selector: 'app-customer-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomerViewComponent, CustomerEditComponent],
  template: `
    <div class="p-4 md:p-6 max-w-lg">
      @if (customer(); as customerData) {
        @if (editMode()) {
          <app-customer-edit
            [customer]="customerData"
            [saving]="customerStore.saving()"
            (saveCustomer)="save($event)"
            (cancelEdit)="editMode.set(false)"
          />
        } @else {
          <app-customer-view [customer]="customerData" (edit)="editMode.set(true)" />
        }
      }
    </div>
  `,
})
export class CustomerProfileComponent {
  private readonly layoutStore = inject(CustomerLayoutStore);
  protected readonly customerStore = inject(CustomerStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly editMode = signal(false);
  protected readonly customer = this.layoutStore.customer;

  protected save(write: CustomerWrite): void {
    this.customerStore
      .update(this.customer()!.id, write)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editMode.set(false);
          this.snackBar.open(Labels.CustomerSaveSuccess, undefined, { duration: 3000 });
        },
        error: () => {
          this.snackBar.open(Labels.CustomerSaveError, undefined, { duration: 3000 });
        },
      });
  }
}
