import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-discount-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.DiscountPercent }}</mat-label>
      <input
        matInput
        type="number"
        min="0"
        max="100"
        [disabled]="disabled()"
        [ngModel]="rawValue()"
        (ngModelChange)="rawValue.set($event)"
        (blur)="commit()"
        (keydown.enter)="commit()"
      />
    </mat-form-field>
  `,
})
export class DiscountInputComponent {
  readonly value = input<number | null>(null);
  readonly valueChange = output<number | null>();
  readonly disabled = input(false);

  protected readonly Labels = Labels;
  protected readonly rawValue = signal<number | string>('');

  constructor() {
    effect(() => {
      const v = this.value();
      this.rawValue.set(v !== null ? v : '');
    });
  }

  protected commit(): void {
    const raw = this.rawValue();
    if (raw === '' || raw === null) {
      this.valueChange.emit(0);
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      this.valueChange.emit(parsed);
    } else {
      const current = this.value();
      this.rawValue.set(current !== null ? current : '');
    }
  }
}
