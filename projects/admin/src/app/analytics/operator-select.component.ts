import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { Labels, ManagedUserStore } from '@bikerental/shared';

@Component({
  selector: 'app-operator-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-56">
      <mat-label>{{ Labels.AnalyticsOperatorFilterLabel }}</mat-label>
      <mat-select [value]="value()" (selectionChange)="onSelectionChange($event)">
        <mat-option [value]="undefined">{{ Labels.AnalyticsAllOperatorsOption }}</mat-option>
        @for (operator of operators(); track operator.id) {
          <mat-option [value]="operator.id">
            {{ operator.displayName || operator.username }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class OperatorSelectComponent {
  private readonly store = inject(ManagedUserStore);

  readonly value = input<string | undefined>(undefined);
  readonly valueChange = output<string | undefined>();

  protected readonly Labels = Labels;
  protected readonly operators = computed(() =>
    this.store.users().filter((user) => user.roles.includes('OPERATOR')),
  );

  constructor() {
    if (this.store.users().length === 0 && !this.store.loading()) {
      this.store.load().subscribe();
    }
  }

  protected onSelectionChange(event: MatSelectChange): void {
    this.valueChange.emit(event.value as string | undefined);
  }
}
