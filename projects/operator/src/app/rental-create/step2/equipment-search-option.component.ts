import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { EquipmentSearchItem } from '@bikerental/shared';

interface MatchParts {
  readonly before: string;
  readonly match: string;
  readonly after: string;
}

function splitMatch(text: string, query: string): MatchParts | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const index = text.toLowerCase().indexOf(needle);
  if (index < 0) return null;
  return {
    before: text.slice(0, index),
    match: text.slice(index, index + needle.length),
    after: text.slice(index + needle.length),
  };
}

@Component({
  selector: 'app-equipment-search-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full items-center gap-2 min-w-0' },
  template: `
    <span
      class="inline-flex min-w-9 shrink-0 items-center justify-center rounded border px-2 py-0.5 font-mono text-sm leading-6"
      [class]="
        uidHighlighted()
          ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
          : 'border-slate-300 text-slate-500'
      "
      >{{ item().uid }}</span
    >

    <span class="flex min-w-0 flex-1 flex-col">
      <span class="truncate text-sm text-slate-900"
        >{{ nameParts().before
        }}<span class="font-semibold text-indigo-600">{{ nameParts().match }}</span
        >{{ nameParts().after }}</span
      >
      <span class="truncate text-[11px] text-slate-400">{{ item().type.name }}</span>
    </span>
  `,
})
export class EquipmentSearchOptionComponent {
  readonly item = input.required<EquipmentSearchItem>();
  readonly query = input<string>('');

  private readonly nameMatch = computed(() => splitMatch(this.item().model, this.query()));

  protected readonly nameParts = computed<MatchParts>(
    () => this.nameMatch() ?? { before: this.item().model, match: '', after: '' },
  );

  protected readonly uidHighlighted = computed(
    () => !this.nameMatch() && splitMatch(this.item().uid, this.query()) !== null,
  );
}
