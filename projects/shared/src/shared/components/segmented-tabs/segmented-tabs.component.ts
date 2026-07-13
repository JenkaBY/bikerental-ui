import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface SegmentTab {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav role="tablist" class="flex border-b border-slate-200 bg-white">
      @for (tab of tabs(); track tab.id) {
        @if (linkMode()) {
          <a
            role="tab"
            class="flex-1 flex items-center justify-center gap-1 py-2.5 px-1 text-sm text-slate-500 border-b-2 border-transparent -mb-px whitespace-nowrap"
            [routerLink]="tab.id"
            routerLinkActive="!text-indigo-600 !border-indigo-600 !font-medium"
            [routerLinkActiveOptions]="{ exact: exact() }"
            [attr.aria-label]="iconOnly() ? tab.label : null"
            [title]="iconOnly() ? tab.label : null"
          >
            @if (tab.icon) {
              <mat-icon class="!text-lg !w-5 !h-5">{{ tab.icon }}</mat-icon>
            }
            @if (!iconOnly()) {
              {{ tab.label }}
            }
          </a>
        } @else {
          <button
            role="tab"
            type="button"
            class="flex-1 flex items-center justify-center gap-1 py-2.5 px-1 text-sm border-b-2 -mb-px whitespace-nowrap"
            [class.text-indigo-600]="tab.id === activeId()"
            [class.border-indigo-600]="tab.id === activeId()"
            [class.font-medium]="tab.id === activeId()"
            [class.text-slate-500]="tab.id !== activeId()"
            [class.border-transparent]="tab.id !== activeId()"
            [attr.aria-selected]="tab.id === activeId()"
            [attr.aria-label]="iconOnly() ? tab.label : null"
            [title]="iconOnly() ? tab.label : null"
            (click)="tabSelect.emit(tab.id)"
          >
            @if (tab.icon) {
              <mat-icon class="!text-lg !w-5 !h-5">{{ tab.icon }}</mat-icon>
            }
            @if (!iconOnly()) {
              {{ tab.label }}
            }
          </button>
        }
      }
    </nav>
  `,
})
export class SegmentedTabsComponent {
  readonly tabs = input.required<SegmentTab[]>();
  readonly activeId = input<string>();
  readonly linkMode = input(false, { transform: booleanAttribute });
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly exact = input(false, { transform: booleanAttribute });

  readonly tabSelect = output<string>();
}
