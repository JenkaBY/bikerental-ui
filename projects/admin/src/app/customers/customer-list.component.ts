import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type Customer, CustomerCreateDialogComponent, Labels } from '@bikerental/shared';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomerListStore } from './customer-list.store';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-customer-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerListStore],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatDialogModule,
    MatIcon,
  ],
  template: `
    <div class="p-4 md:p-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold text-slate-800">{{ Labels.CustomersTitle }}</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          <span>{{ Labels.CustomerNewButton }}</span>
        </button>
      </div>

      <mat-form-field appearance="outline" class="w-full mb-4">
        <mat-label>{{ Labels.CustomerSearchPlaceholder }}</mat-label>
        <input
          matInput
          type="text"
          placeholder="{{ Labels.CustomerSearchInputPlaceholder }}"
          [value]="store.searchQuery()"
          (input)="store.search($any($event.target).value)"
        />
      </mat-form-field>

      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Desktop table -->
      <div class="hidden md:block">
        <table mat-table [dataSource]="this.getCustomer()" class="w-full">
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.CustomerPhoneLabel }}</th>
            <td mat-cell *matCellDef="let row">{{ row.phone }}</td>
          </ng-container>
          <ng-container matColumnDef="firstName">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.CustomerFirstNameLabel }}</th>
            <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
          </ng-container>
          <ng-container matColumnDef="lastName">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.CustomerLastNameLabel }}</th>
            <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            class="cursor-pointer hover:bg-slate-50"
            (click)="navigate(row)"
          ></tr>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="flex flex-col gap-2 md:hidden">
        @for (customer of this.getCustomer(); track customer.id) {
          <mat-card class="cursor-pointer" (click)="navigate(customer)">
            <mat-card-content class="py-3">
              <p class="font-medium">{{ customer.phone }}</p>
              <p class="text-sm text-slate-500">{{ customer.firstName }} {{ customer.lastName }}</p>
            </mat-card-content>
          </mat-card>
        } @empty {
          @if (!store.loading()) {
            <p class="text-slate-400 text-center mt-8">{{ Labels.CustomerEmptyState }}</p>
          }
        }
      </div>

      @if (!store.loading() && this.getCustomer().length === 0) {
        <p class="hidden md:block text-slate-400 text-center mt-8">
          {{ Labels.CustomerEmptyState }}
        </p>
      }
    </div>
  `,
})
export class CustomerListComponent {
  protected readonly Labels = Labels;
  protected readonly displayedColumns = ['phone', 'firstName', 'lastName'];

  protected readonly store = inject(CustomerListStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  public openCreateDialog(): void {
    const ref = this.dialog.open(CustomerCreateDialogComponent, { data: {} });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: unknown) => {
        if (id) this.router.navigate(['/customers', id as string]);
      });
  }

  public navigate(customer: Customer) {
    this.router.navigate(['/customers', customer.id]);
  }

  getCustomer(): Customer[] {
    return this.store.customers();
  }
}
