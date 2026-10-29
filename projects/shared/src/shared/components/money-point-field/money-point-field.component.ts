import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CurrentPointStore } from '../../../core/state/current-point.store';
import { Labels } from '../../constant/labels';
import { FormErrorMessages } from '../../validators/form-error-messages';

@Component({
  selector: 'app-money-point-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.MoneyPointLabel }}</mat-label>
      <mat-select [formControl]="control()">
        @for (point of pointStore.points(); track point.slug) {
          <mat-option [value]="point.slug">{{ point.name }}</mat-option>
        }
      </mat-select>
      <mat-hint>{{ Labels.MoneyPointHint }}</mat-hint>
      @if (control().hasError('required')) {
        <mat-error>{{ FormErrorMessages.pointRequired }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class MoneyPointFieldComponent {
  protected readonly pointStore = inject(CurrentPointStore);
  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;

  readonly control = input.required<FormControl<string | null>>();

  constructor() {
    if (this.pointStore.points().length === 0) {
      this.pointStore
        .load()
        .pipe(takeUntilDestroyed(inject(DestroyRef)))
        .subscribe({ error: () => undefined });
    }
  }
}
