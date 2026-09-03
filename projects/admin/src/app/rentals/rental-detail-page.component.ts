import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DamageReportStore,
  RentalCostCalculationStore,
  Labels,
  PageHeaderComponent,
  RentalSignatureStore,
  RentalStore,
  RentalTransactionsStore,
} from '@bikerental/shared';
import { RentalDetailPanelComponent } from './rental-detail-panel.component';

@Component({
  selector: 'app-rental-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RentalStore,
    BatchRentalPropertyStore,
    RentalCostCalculationStore,
    CustomerFinanceStore,
    RentalTransactionsStore,
    RentalSignatureStore,
    DamageReportStore,
  ],
  imports: [PageHeaderComponent, RentalDetailPanelComponent],
  template: `
    <div class="flex flex-col h-full -m-4">
      <app-page-header [title]="Labels.RentalDetailsTitle" (back)="onBack()" />
      <div class="flex-1 min-h-0 overflow-y-auto p-4">
        <div class="max-w-2xl">
          <app-rental-detail-panel />
        </div>
      </div>
    </div>
  `,
})
export class RentalDetailPageComponent {
  protected readonly Labels = Labels;

  private readonly store = inject(RentalStore);
  private readonly location = inject(Location);

  readonly id = input.required<string>();

  constructor() {
    effect(() => {
      const rentalId = Number(this.id());
      if (Number.isInteger(rentalId)) this.store.loadDetail(rentalId);
    });
  }

  protected onBack(): void {
    this.location.back();
  }
}
