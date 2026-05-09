import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-special-price-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.SpecialPrice }}</mat-label>
      <input
        matInput
        type="number"
        min="0.01"
        step="0.01"
        [ngModel]="rawValue()"
        (ngModelChange)="rawValue.set($event)"
        (blur)="commit()"
        (keydown.enter)="commit()"
      />
      @if (showError()) {
        <mat-error>{{ Labels.SpecialPrice }} is required</mat-error>
      }
    </mat-form-field>
  `,
})
export class SpecialPriceInputComponent {
  readonly value = input<number | null>(null);
  readonly showRequired = input<boolean>(false);
  readonly valueChange = output<number | null>();

  protected readonly Labels = Labels;
  protected readonly rawValue = signal<number | string>('');

  protected readonly showError = signal(false);

  constructor() {
    effect(() => {
      const v = this.value();
      this.rawValue.set(v !== null ? v : '');
    });
    effect(() => {
      this.showError.set(this.showRequired() && !this.value());
    });
  }

  protected commit(): void {
    const raw = this.rawValue();
    if (raw === '' || raw === null) {
      this.valueChange.emit(null);
      this.showError.set(this.showRequired());
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed) && parsed > 0) {
      this.valueChange.emit(parsed);
      this.showError.set(false);
    } else {
      const current = this.value();
      this.rawValue.set(current !== null ? current : '');
    }
  }
}
