import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { EquipmentTypeStore, Labels } from '@bikerental/shared';

@Component({
  selector: 'app-equipment-type-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-56">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [value]="value()" (selectionChange)="onSelectionChange($event)">
        @if (allowAll()) {
          <mat-option [value]="undefined">{{ Labels.AnalyticsAllEquipmentTypesOption }}</mat-option>
        }
        @for (type of store.typesForEquipment(); track type.slug) {
          <mat-option [value]="type.slug">{{ type.name || type.slug }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class EquipmentTypeSelectComponent {
  protected readonly store = inject(EquipmentTypeStore);

  readonly value = input<string | undefined>(undefined);
  readonly valueChange = output<string | undefined>();
  readonly label = input<string>(Labels.AnalyticsEquipmentTypeFilterLabel);
  readonly allowAll = input(true);

  protected readonly Labels = Labels;

  constructor() {
    if (this.store.types().length === 0 && !this.store.loading()) {
      this.store.load().subscribe();
    }
  }

  protected onSelectionChange(event: MatSelectChange): void {
    this.valueChange.emit(event.value as string | undefined);
  }
}
