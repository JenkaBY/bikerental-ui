import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels, mapEquipmentItemStatus, mapRentalStatus } from '@bikerental/shared';
import { CustomerRentalsStore } from '../../customer-rentals.store';

@Component({
  selector: 'app-customer-rentals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="p-4 md:p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">{{ Labels.CustomerRentalsTabLabel }}</h2>
        <button mat-stroked-button (click)="newRental()">
          <mat-icon>add</mat-icon>
          {{ Labels.CustomerNewRentalButton }}
        </button>
      </div>

      @if (store.listLoading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40" />
        </div>
      } @else if (store.rentals().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ Labels.CustomerRentalsEmptyState }}</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (rental of store.rentals(); track rental.id) {
            <div
              class="border border-slate-200 rounded-lg overflow-hidden"
              [class.border-primary-300]="store.isExpanded(rental.id)"
            >
              <!-- Collapsed row -->
              <button
                class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                (click)="store.toggleExpand(rental.id)"
              >
                <mat-icon class="text-slate-400 shrink-0">
                  {{ store.isExpanded(rental.id) ? 'expand_less' : 'expand_more' }}
                </mat-icon>
                <span class="flex-1 text-sm">{{
                  rental.startedAt | date: 'dd MMM yyyy HH:mm'
                }}</span>
                <mat-chip [color]="rentalColour(rental.status)" highlighted>
                  {{ rentalLabel(rental.status) }}
                </mat-chip>
              </button>

              <!-- Expanded detail -->
              @if (store.isExpanded(rental.id)) {
                @if (store.loadingDetailIds().has(rental.id)) {
                  <div class="flex justify-center py-4">
                    <mat-spinner diameter="24" />
                  </div>
                } @else if (store.detailCache().get(rental.id); as detail) {
                  <div class="px-4 pb-4 flex flex-col gap-2">
                    @for (item of detail.equipmentItems; track item.equipmentId) {
                      <div class="flex items-center gap-2 text-sm">
                        <span class="text-slate-600">{{
                          item.equipmentUid ?? item.equipmentId
                        }}</span>
                        <mat-chip [color]="itemColour(item.status)" highlighted>
                          {{ itemLabel(item.status) }}
                        </mat-chip>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CustomerRentalsComponent implements OnInit {
  protected readonly Labels = Labels;

  protected readonly store = inject(CustomerRentalsStore);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.store.load();
  }

  protected rentalColour(status: string): string {
    return mapRentalStatus(status).colour;
  }

  protected rentalLabel(status: string): string {
    return mapRentalStatus(status).labelKey;
  }

  protected itemColour(status: string): string {
    return mapEquipmentItemStatus(status).colour;
  }

  protected itemLabel(status: string): string {
    return mapEquipmentItemStatus(status).labelKey;
  }

  protected newRental(): void {
    this.snackBar.open(Labels.CustomerNewRentalComingSoon, undefined, { duration: 3000 });
  }
}
