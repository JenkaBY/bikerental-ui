import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import type { Money, RentalCostBreakdown } from '../../../core/models';
import { Labels } from '../../constant/labels';
import { MoneyPipe } from '../../pipes/money.pipe';
import { PricePrefixPipe } from '../../pipes/price-prefix.pipe';
import {
  EquipmentUnitIdentity,
  EquipmentUnitSummaryComponent,
} from './equipment-unit-summary.component';
import { EquipmentUnitDetailsComponent } from './equipment-unit-details.component';

export type EquipmentUnitPriceKind = 'estimated' | 'current' | 'final';

export interface EquipmentUnitViewModel extends EquipmentUnitIdentity {
  price: Money | null;
  priceKind: EquipmentUnitPriceKind;
  plannedCost: Money | null;
  breakdown: RentalCostBreakdown | null;
}

@Component({
  selector: 'app-equipment-unit-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MoneyPipe,
    PricePrefixPipe,
    EquipmentUnitSummaryComponent,
    EquipmentUnitDetailsComponent,
  ],
  template: `
    <div class="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 leading-tight">
      <div class="flex items-center gap-2">
        @if (showCheckbox()) {
          <mat-checkbox
            class="shrink-0 self-center -mr-1 [--mat-checkbox-state-layer-size:18px]"
            [checked]="checked()"
            [disabled]="checkboxDisabled()"
            (change)="checkedChange.emit($event.checked)"
          />
        }

        <app-equipment-unit-summary [unit]="unit()" class="ml-1" />

        <div class="flex items-center gap-0.5 shrink-0">
          <span class="text-sm font-semibold text-slate-900 whitespace-nowrap">
            {{ unit().price ? (unit().priceKind | pricePrefix) + (unit().price | money) : '—' }}
          </span>

          <button
            mat-icon-button
            type="button"
            class="shrink-0 !h-6 !w-6 !p-0"
            (click)="toggle()"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="expanded() ? Labels.CollapseDetails : Labels.ShowDetails"
          >
            <mat-icon class="!h-5 !w-5 !text-xl !leading-5">{{
              expanded() ? 'expand_less' : 'expand_more'
            }}</mat-icon>
          </button>

          @if (showRemove()) {
            <button
              mat-icon-button
              type="button"
              class="shrink-0 !h-5 !w-5 !leading-5 !p-0"
              (click)="removed.emit()"
              [attr.aria-label]="'Remove ' + unit().uid"
            >
              <mat-icon class="!h-4 !w-4 !text-base !leading-4">close</mat-icon>
            </button>
          }
        </div>
      </div>

      @if (expanded()) {
        <app-equipment-unit-details
          [plannedCost]="unit().plannedCost"
          [breakdown]="unit().breakdown"
        />
      }
    </div>
  `,
})
export class EquipmentUnitCardComponent {
  readonly unit = input.required<EquipmentUnitViewModel>();
  readonly showCheckbox = input(false, { transform: booleanAttribute });
  readonly checked = input(false, { transform: booleanAttribute });
  readonly checkboxDisabled = input(false, { transform: booleanAttribute });
  readonly showRemove = input(false, { transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  readonly removed = output<void>();

  protected readonly Labels = Labels;
  protected readonly expanded = signal(false);

  protected toggle(): void {
    this.expanded.update((v) => !v);
  }
}
