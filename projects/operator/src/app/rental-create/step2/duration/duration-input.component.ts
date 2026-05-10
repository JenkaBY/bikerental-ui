import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
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
      <span matTextSuffix>{{ Labels.MinuteShort }}</span>
    </mat-form-field>
  `,
})
export class DurationInputComponent {
  readonly value = input.required<number>();
  readonly min = input<number>(30);
  readonly max = input<number>(2880);
  readonly valueChange = output<number>();

  protected readonly Labels = Labels;
  protected rawValue = linkedSignal(() => this.value());

  protected commit(): void {
    const parsed = Number(this.rawValue());
    if (isNaN(parsed) || parsed <= 0) {
      this.rawValue.set(this.value());
      return;
    }
    const clamped = Math.min(this.max(), Math.max(this.min(), parsed));
    this.valueChange.emit(clamped);
  }
}
