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
  host: {
    class: 'block px-3 py-2 leading-tight cursor-pointer select-none',
    role: 'button',
    tabindex: '0',
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-label]': 'expanded() ? Labels.CollapseDetails : Labels.ShowDetails',
    '(click)': 'toggle()',
    '(keydown.enter)': 'toggle()',
    '(keydown.space)': 'onSpace($event)',
  },
  template: `
    <div class="flex items-center gap-2">
      @if (showCheckbox()) {
        <mat-checkbox
          class="shrink-0 self-center -mr-1 [--mat-checkbox-state-layer-size:18px]"
          [checked]="checked()"
          [disabled]="checkboxDisabled()"
          (click)="$event.stopPropagation()"
          (change)="checkedChange.emit($event.checked)"
        />
      }

      <app-equipment-unit-summary [unit]="unit()" class="ml-1" />

      <div class="flex items-center shrink-0">
        <span class="text-sm font-semibold text-slate-900 whitespace-nowrap">
          {{ unit().price ? (unit().priceKind | pricePrefix) + (unit().price | money) : '—' }}
        </span>

        @if (showRemove()) {
          <button
            mat-icon-button
            type="button"
            class="shrink-0 ml-2 pl-1 border-l border-slate-200 [--mdc-icon-button-state-layer-size:40px]"
            (click)="onRemove($event)"
            [attr.aria-label]="'Remove ' + unit().uid"
          >
            <mat-icon>close</mat-icon>
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

  protected onSpace(event: Event): void {
    event.preventDefault();
    this.toggle();
  }

  protected onRemove(event: Event): void {
    event.stopPropagation();
    this.removed.emit();
  }
}
