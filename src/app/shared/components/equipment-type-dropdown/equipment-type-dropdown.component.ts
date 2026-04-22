import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { EquipmentTypeStore } from '@store.equipment-type.store';

@Component({
  selector: 'app-equipment-type-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentTypeDropdownComponent),
      multi: true,
    },
  ],
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label }}</mat-label>
      <mat-select
        [value]="value()"
        [disabled]="isDisabled()"
        (selectionChange)="onSelect($event.value)"
        (blur)="onTouched()"
      >
        @if (loading()) {
          <mat-option disabled i18n>Loading...</mat-option>
        }
        @for (t of types(); track t.slug) {
          <mat-option [value]="t.slug">{{ t.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class EquipmentTypeDropdownComponent implements ControlValueAccessor {
  private store = inject(EquipmentTypeStore);

  private _value = signal<string | null>(null);
  readonly value = this._value.asReadonly();

  readonly loading = this.store.loading;
  readonly isDisabled = signal(false);
  readonly showAll = input(true);
  readonly types = computed(() => {
    return this.showAll() ? this.store.types() : this.store.typesForEquipment();
  });

  private onChange: (v: string | null) => void = () => void 0;
  onTouched: () => void = () => void 0;

  readonly label = $localize`Equipment Type`;

  onSelect(slug: string | null): void {
    this._value.set(slug ?? null);
    this.onChange(slug ?? null);
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(v: string | null): void {
    this._value.set(v ?? null);
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }
}
