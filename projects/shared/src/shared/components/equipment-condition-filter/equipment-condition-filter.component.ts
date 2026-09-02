import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { EQUIPMENT_CONDITIONS } from '../../../core/mappers/equipment-condition.mapper';
import { Labels } from '../../constant/labels';
import type { EquipmentConditionSlug } from '@ui-models';

@Component({
  selector: 'app-equipment-condition-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.Condition }}</mat-label>
      <mat-select multiple [value]="value()" (selectionChange)="valueChange.emit($event.value)">
        @for (c of conditions; track c.slug) {
          <mat-option [value]="c.slug">{{ c.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class EquipmentConditionFilterComponent {
  readonly value = input<EquipmentConditionSlug[]>([]);
  readonly valueChange = output<EquipmentConditionSlug[]>();

  protected readonly Labels = Labels;
  protected readonly conditions = EQUIPMENT_CONDITIONS;
}
