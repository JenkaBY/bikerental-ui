import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavItem } from '../sidebar-nav-item/nav-item.model';

@Component({
  selector: 'app-bottom-nav-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <a
      [routerLink]="item().route"
      routerLinkActive="bottom-nav-active"
      class="bottom-nav-item flex flex-col items-center justify-center flex-1 py-2 no-underline text-slate-500 text-xs transition-colors [-webkit-tap-highlight-color:transparent]"
    >
      <mat-icon class="text-2xl! w-6! h-6! mb-1!">{{ item().icon }}</mat-icon>
      <span>{{ item().label }}</span>
    </a>
  `,
})
export class BottomNavItemComponent {
  item = input.required<NavItem>();
}
