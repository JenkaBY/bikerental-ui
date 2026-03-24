import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';

@Component({
  selector: 'app-flat-hourly-params',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div [formGroup]="group()" class="col-span-2 grid grid-cols-2 gap-4">
      @if (description()) {
        <div class="col-span-2 text-sm text-slate-500">{{ description() }}</div>
      }
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.HourlyPrice }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="hourlyPrice" />
        @if (group().controls['hourlyPrice'].hasError('required')) {
          <mat-error>{{ errors.required }}</mat-error>
        }
        @if (group().controls['hourlyPrice'].hasError('min')) {
          <mat-error>{{ errors.mustBePositive }}</mat-error>
        }
      </mat-form-field>
    </div>
  `,
})
export class FlatHourlyParamsComponent {
  readonly group = input.required<FormGroup>();
  readonly description = input<string | undefined>('');
  readonly labels = Labels;
  readonly errors = FormErrorMessages;
}
