import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EquipmentBadgeComponent, Labels, type CustomerRentalEquipment } from '@bikerental/shared';

const COLLAPSED_LIMIT = 3;

@Component({
  selector: 'app-rental-equipment-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatTooltipModule, EquipmentBadgeComponent],
  template: `
    @if (items().length) {
      <div class="flex flex-wrap items-center gap-1 py-1" [matTooltip]="fullList()">
        @for (e of visibleItems(); track $index) {
          <app-equipment-badge [uid]="e.uid" [name]="e.name" />
        }
        @if (hiddenCount() > 0) {
          <button
            type="button"
            mat-button
            class="!min-w-0 !px-1 !text-xs !text-indigo-600"
            [attr.aria-label]="expanded() ? Labels.ShowLess : Labels.ShowAll"
            (click)="onToggle($event)"
          >
            {{ expanded() ? Labels.ShowLess : '+' + hiddenCount() }}
          </button>
        }
      </div>
    } @else {
      <span class="text-slate-400">&mdash;</span>
    }
  `,
})
export class RentalEquipmentCellComponent {
  protected readonly Labels = Labels;

  readonly items = input.required<readonly CustomerRentalEquipment[]>();

  protected readonly expanded = signal(false);

  protected readonly visibleItems = computed(() =>
    this.expanded() ? this.items() : this.items().slice(0, COLLAPSED_LIMIT),
  );

  protected readonly hiddenCount = computed(() =>
    Math.max(0, this.items().length - COLLAPSED_LIMIT),
  );

  protected readonly fullList = computed(() =>
    this.items()
      .map((e) => `${e.uid || 'NA'} - ${e.name}`)
      .join('\n'),
  );

  protected onToggle(event: Event): void {
    event.stopPropagation();
    this.expanded.update((value) => !value);
  }
}
