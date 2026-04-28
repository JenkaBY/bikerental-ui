import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Labels } from '../../constant/labels';
import type { PaymentMethod } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-payment-method-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, MatOptionModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentMethodSelectComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ Labels.PaymentMethod }}</mat-label>
      <mat-select [value]="value" (selectionChange)="onChange($event.value)">
        <mat-option value="CASH">{{ Labels.PaymentMethodCash }}</mat-option>
        <mat-option value="BANK_TRANSFER">{{ Labels.PaymentMethodBankTransfer }}</mat-option>
        <mat-option value="CARD_TERMINAL">{{ Labels.PaymentMethodCardTerminal }}</mat-option>
      </mat-select>
    </mat-form-field>
  `,
})
export class PaymentMethodSelectComponent implements ControlValueAccessor {
  protected readonly Labels = Labels;
  protected value: PaymentMethod | null = null;

  private touched = false;
  // Register callbacks will always set these; use definite assignment to avoid creating empty functions
  private _onChange!: (v: PaymentMethod | null) => void;
  private _onTouched!: () => void;

  writeValue(obj: PaymentMethod | null): void {
    this.value = obj;
  }

  registerOnChange(fn: (v: PaymentMethod | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  onChange(v: PaymentMethod | null): void {
    this.value = v;
    this._onChange(v);
    if (!this.touched) {
      this._onTouched();
      this.touched = true;
    }
  }
}
