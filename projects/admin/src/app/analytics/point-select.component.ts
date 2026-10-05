import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { Labels, PointAdminStore } from '@bikerental/shared';

@Component({
  selector: 'app-point-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointAdminStore],
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-48">
      <mat-label>{{ Labels.AnalyticsPointFilterLabel }}</mat-label>
      <mat-select [value]="value()" (selectionChange)="onSelectionChange($event)">
        <mat-option [value]="undefined">{{ Labels.AnalyticsAllPointsOption }}</mat-option>
        @for (point of store.points(); track point.slug) {
          <mat-option [value]="point.slug">{{ point.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class PointSelectComponent {
  protected readonly store = inject(PointAdminStore);

  readonly value = input<string | undefined>(undefined);
  readonly valueChange = output<string | undefined>();

  protected readonly Labels = Labels;

  constructor() {
    this.store
      .load()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe();
  }

  protected onSelectionChange(event: MatSelectChange): void {
    this.valueChange.emit(event.value as string | undefined);
  }
}
