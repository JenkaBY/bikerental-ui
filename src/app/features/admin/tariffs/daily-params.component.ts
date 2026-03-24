import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';

@Component({
  selector: 'app-daily-params',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div [formGroup]="group()" class="col-span-2 grid grid-cols-2 gap-4">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.DailyPrice }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="dailyPrice" />
        @if (group().controls['dailyPrice'].hasError('required')) {
          <mat-error>{{ errors.required }}</mat-error>
        }
        @if (group().controls['dailyPrice'].hasError('min')) {
          <mat-error>{{ errors.mustBePositive }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.OvertimeHourlyPrice }}</mat-label>
        <input
          matInput
          type="number"
          min="0.01"
          step="0.01"
          formControlName="overtimeHourlyPrice"
        />
        @if (group().controls['overtimeHourlyPrice'].hasError('min')) {
          <mat-error>{{ errors.mustBePositive }}</mat-error>
        }
      </mat-form-field>
    </div>
  `,
})
export class DailyParamsComponent {
  readonly group = input.required<FormGroup>();
  readonly labels = Labels;
  readonly errors = FormErrorMessages;
}
