import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-duration-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.DurationMinutes }}</mat-label>
      <input
        matInput
        type="number"
        [min]="min()"
        [max]="max()"
        [ngModel]="rawValue()"
        (ngModelChange)="rawValue.set($event)"
        (blur)="commit()"
        (keydown.enter)="commit()"
      />
    </mat-form-field>
  `,
})
export class DurationInputComponent {
  readonly value = input.required<number>();
  readonly min = input<number>(30);
  readonly max = input<number>(2880);
  readonly valueChange = output<number>();

  protected readonly Labels = Labels;
  protected readonly rawValue = signal<number | string>('');

  constructor() {
    effect(() => {
      this.rawValue.set(this.value());
    });
  }

  protected commit(): void {
    const parsed = Number(this.rawValue());
    if (!isNaN(parsed) && parsed > 0) {
      this.valueChange.emit(parsed);
    } else {
      this.rawValue.set(this.value());
    }
  }
}
