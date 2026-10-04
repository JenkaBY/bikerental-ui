import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import type { Customer, ReturnableRental } from '@bikerental/shared';
import {
  CurrentPointStore,
  Labels,
  QrScanDialogComponent,
  ReturnableRentalLookupStore,
} from '@bikerental/shared';
import { CustomerSearchInputComponent } from '../rental-create/step1/customer-search-input.component';
import { ReturnableRentalCardComponent } from './returnable-rental-card.component';

@Component({
  selector: 'app-other-point-return-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReturnableRentalLookupStore],
  imports: [
    CustomerSearchInputComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReturnableRentalCardComponent,
  ],
  template: `
    <div class="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <p class="text-sm text-slate-500">{{ Labels.ReturnLookupHint }}</p>

      <app-customer-search-input
        [allowCreate]="false"
        (customerSelected)="onCustomerSelected($event)"
      />

      <button
        mat-flat-button
        color="primary"
        class="w-full"
        [disabled]="store.loading()"
        (click)="openScanner()"
      >
        <mat-icon>qr_code_scanner</mat-icon>
        {{ Labels.ScanToReturn }}
      </button>

      @if (store.loading()) {
        <div class="flex justify-center"><mat-spinner diameter="24" /></div>
      } @else {
        @switch (store.outcome()) {
          @case ('empty') {
            <p class="text-sm text-amber-700 text-center">{{ Labels.NoOpenRentalsForCustomer }}</p>
          }
          @case ('notFound') {
            <p class="text-sm text-amber-700 text-center">
              {{ Labels.NoOpenRentalForScannedItem }}
            </p>
          }
          @case ('found') {
            <div class="flex flex-col gap-2">
              @for (rental of store.results(); track rental.id) {
                <app-returnable-rental-card
                  [rental]="rental"
                  [pickUpPointName]="pointName(rental)"
                  (selected)="openRental(rental)"
                />
              }
            </div>
          }
        }
      }
    </div>
  `,
})
export class OtherPointReturnTabComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(ReturnableRentalLookupStore);
  private readonly pointStore = inject(CurrentPointStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected pointName(rental: ReturnableRental): string | null {
    const slug = rental.pickUpPointSlug;
    if (!slug) return null;
    return this.pointStore.nameBySlug().get(slug) ?? slug;
  }

  protected onCustomerSelected(customer: Customer): void {
    this.store.lookup({ customerId: customer.id });
  }

  constructor() {
    effect(() => {
      const results = this.store.results();
      if (this.store.outcome() === 'found' && results.length === 1) {
        this.openRental(results[0]);
      }
    });
  }

  protected openRental(rental: ReturnableRental): void {
    const selectUid = this.store.scannedUid();
    void this.router.navigate(['/rentals', rental.id], {
      queryParams: {
        selectUid: selectUid ?? undefined,
        selectAll: selectUid ? undefined : true,
        returnFor: rental.atThisPoint ? undefined : rental.customerId,
      },
    });
  }

  protected openScanner(): void {
    this.dialog
      .open(QrScanDialogComponent, {
        data: { title: Labels.ScanEquipmentToReturnTitle },
        width: '420px',
      })
      .afterClosed()
      .pipe(
        filter((uid): uid is string => typeof uid === 'string' && uid.length > 0),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((uid) => this.store.lookup({ equipmentUid: uid }));
  }
}
