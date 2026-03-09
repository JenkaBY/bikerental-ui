import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from './nav-item.model';

@Component({
  selector: 'app-sidebar-nav-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  template: `
    <a
      mat-list-item
      [routerLink]="item().route"
      routerLinkActive="active-nav-item"
      class="w-full flex items-center gap-1 px-4 py-3 rounded-md hover:bg-slate-100! focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      <mat-icon matListItemIcon class="text-slate-600 text-xl !mr-2">{{ item().icon }}</mat-icon>
      <span matListItemTitle class="text-sm font-medium text-slate-800">{{ item().label }}</span>
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SidebarNavItemComponent {
  item = input.required<NavItem>();
}
