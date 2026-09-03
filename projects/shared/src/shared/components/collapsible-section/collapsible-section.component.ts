import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-collapsible-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1">
        <button
          type="button"
          mat-button
          class="!self-start !min-w-0 !px-1 !text-slate-500"
          [attr.aria-expanded]="expanded()"
          (click)="onToggle()"
        >
          <mat-icon class="!text-base">{{ expanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
          <span class="text-xs uppercase tracking-wide">{{ title() }}</span>
          @if (loading()) {
            <mat-spinner diameter="14" />
          }
        </button>
        <ng-content select="[actions]" />
      </div>

      @if (expanded() && !loading()) {
        @if (empty()) {
          <span class="text-sm text-slate-400 pl-1">{{ emptyMessage() || Labels.NoData }}</span>
        } @else {
          <ng-content />
        }
      }
    </div>
  `,
})
export class CollapsibleSectionComponent {
  protected readonly Labels = Labels;

  readonly title = input.required<string>();
  readonly loading = input(false);
  readonly empty = input(false);
  readonly emptyMessage = input<string>();

  readonly expandedChange = output<boolean>();

  protected readonly expanded = signal(false);

  protected onToggle(): void {
    this.expanded.update((value) => !value);
    this.expandedChange.emit(this.expanded());
  }
}
