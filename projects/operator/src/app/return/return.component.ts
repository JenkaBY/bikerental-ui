import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { SegmentTab } from '@bikerental/shared';
import { Labels, SegmentedTabsComponent } from '@bikerental/shared';
import { HomeReturnTabComponent } from './home-return-tab.component';
import { OtherPointReturnTabComponent } from './other-point-return-tab.component';

type ReturnTab = 'home' | 'other';

@Component({
  selector: 'app-return',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HomeReturnTabComponent, OtherPointReturnTabComponent, SegmentedTabsComponent],
  template: `
    <div class="flex flex-col h-[calc(100%+2rem)] -m-4">
      <h1 class="px-4 pt-4 pb-2 text-xl font-semibold text-slate-800 text-center">
        {{ Labels.EquipmentReturnPageTitle }}
      </h1>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @switch (activeTab()) {
          @case ('home') {
            <app-home-return-tab />
          }
          @case ('other') {
            <app-other-point-return-tab />
          }
        }
      </div>
      <app-segmented-tabs
        class="shrink-0 border-t border-slate-200"
        [tabs]="tabs"
        [activeId]="activeTab()"
        (tabSelect)="activeTab.set($event === 'other' ? 'other' : 'home')"
      />
    </div>
  `,
})
export class ReturnComponent {
  protected readonly Labels = Labels;

  protected readonly tabs: SegmentTab[] = [
    { id: 'home', label: Labels.ReturnTabHomePoint, icon: 'home' },
    { id: 'other', label: Labels.ReturnTabOtherPoint, icon: 'storefront' },
  ];

  protected readonly activeTab = signal<ReturnTab>('home');
}
