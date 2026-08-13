import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { EquipmentUnitOptionsStore, Labels } from '@bikerental/shared';

@Component({
  selector: 'app-equipment-unit-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EquipmentUnitOptionsStore],
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-56">
      <mat-label>{{ Labels.AnalyticsEquipmentUnitFilterLabel }}</mat-label>
      <mat-select
        [value]="value()"
        [disabled]="!typeSlug()"
        (selectionChange)="onSelectionChange($event)"
      >
        <mat-option [value]="undefined">{{ Labels.AnalyticsAllEquipmentUnitsOption }}</mat-option>
        @for (unit of store.items(); track unit.id) {
          <mat-option [value]="unit.id.toString()">{{ unit.uid }} — {{ unit.model }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class EquipmentUnitSelectComponent {
  protected readonly store = inject(EquipmentUnitOptionsStore);

  readonly typeSlug = input<string | undefined>(undefined);
  readonly value = input<string | undefined>(undefined);
  readonly valueChange = output<string | undefined>();

  protected readonly Labels = Labels;

  constructor() {
    effect(() => this.store.setTypeSlug(this.typeSlug()));
  }

  protected onSelectionChange(event: MatSelectChange): void {
    this.valueChange.emit(event.value as string | undefined);
  }
}
