import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <button
      class="w-full h-full p-6 border rounded-lg shadow-sm hover:shadow-md hover:cursor-pointer focus:outline-none text-left flex flex-col justify-between"
      (click)="handleSelect()"
      [attr.aria-label]="ariaLabel()"
      [disabled]="disabled()"
      type="button"
    >
      <div class="text-lg font-medium">{{ title() }}</div>
      <div class="text-sm text-slate-500 mt-2">{{ description() }}</div>
    </button>
  `,
})
export class DashboardCardComponent {
  readonly title = input<string>('');

  readonly description = input<string>('');

  readonly ariaLabel = input<string>('');

  readonly disabled = input<boolean>(false);

  readonly activate = output<void>();

  handleSelect(): void {
    if (this.disabled()) return;
    this.activate.emit();
  }
}
