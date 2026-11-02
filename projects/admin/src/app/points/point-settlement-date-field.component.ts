import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormErrorMessages, Labels, SERVER_ERROR_KEY } from '@bikerental/shared';

@Component({
  selector: 'app-point-settlement-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ labels.PointMoveSettlementDate }}</mat-label>
      <input matInput [matDatepicker]="picker" [max]="max()" [formControl]="control()" />
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-datepicker #picker />
      @if (control().hasError(serverKey)) {
        <mat-error>{{ control().getError(serverKey) }}</mat-error>
      } @else if (control().hasError('required')) {
        <mat-error>{{ messages.settlementDateRequired }}</mat-error>
      } @else if (control().hasError('futureDate') || control().hasError('matDatepickerMax')) {
        <mat-error>{{ messages.settlementDateFuture }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class PointSettlementDateFieldComponent {
  readonly control = input.required<FormControl<Date | null>>();
  readonly max = input.required<Date>();

  protected readonly labels = Labels;
  protected readonly messages = FormErrorMessages;
  protected readonly serverKey = SERVER_ERROR_KEY;
}
