import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentTypeService } from '../../../core/api';
import { EquipmentType } from '../../../core/domain';

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
          <mat-option disabled i18n>Loading…</mat-option>
        }
        @for (t of types(); track t.slug) {
          <mat-option [value]="t.slug">{{ t.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class EquipmentTypeDropdownComponent implements ControlValueAccessor, OnInit {
  private service = inject(EquipmentTypeService);
  private destroyRef = inject(DestroyRef);

  private _value = signal<string | null>(null);
  readonly value = this._value.asReadonly();

  readonly types = signal<EquipmentType[]>([]);
  readonly loading = signal(false);
  readonly isDisabled = signal(false);

  private onChange: (v: string | null) => void = () => void 0;
  onTouched: () => void = () => void 0;

  readonly label = $localize`Equipment Type`;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list: EquipmentType[]) => {
          const sorted = (list ?? [])
            .slice()
            .sort((a: EquipmentType, b: EquipmentType) => a.name.localeCompare(b.name));
          this.types.set(sorted);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

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
