import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaxDecimalsDirective } from '@bikerental/shared';

@Component({
  selector: 'app-inline-number-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MaxDecimalsDirective],
  template: `
    <span class="inline-flex items-center gap-1">
      <input
        type="number"
        class="h-8 px-2 text-sm text-right border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 {{
          widthClass()
        }}"
        [min]="min()"
        [max]="max()"
        [appMaxDecimals]="decimals()"
        [attr.aria-label]="ariaLabel()"
        [ngModel]="rawValue()"
        (ngModelChange)="rawValue.set($event)"
        (blur)="commit()"
        (keydown.enter)="commit()"
      />
      @if (suffix()) {
        <span class="text-sm text-slate-600">{{ suffix() }}</span>
      }
    </span>
  `,
})
export class InlineNumberInputComponent {
  readonly value = input<number | null>(null);
  readonly suffix = input('');
  readonly decimals = input(0);
  readonly min = input(0);
  readonly max = input<number | null>(null);
  readonly emptyValue = input<number | null>(0);
  readonly widthClass = input('w-16');
  readonly ariaLabel = input('');
  readonly valueChange = output<number | null>();

  protected readonly rawValue = linkedSignal<number | string>(() => this.value() ?? '');

  protected commit(): void {
    const raw = this.rawValue();
    if (raw === '' || raw === null) {
      this.valueChange.emit(this.emptyValue());
      return;
    }
    const parsed = Number(raw);
    if (isNaN(parsed)) {
      this.rawValue.set(this.value() ?? '');
      return;
    }
    const max = this.max();
    const clamped =
      max !== null ? Math.min(max, Math.max(this.min(), parsed)) : Math.max(this.min(), parsed);
    this.valueChange.emit(clamped);
  }
}
