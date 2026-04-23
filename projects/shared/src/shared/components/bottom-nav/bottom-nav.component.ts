import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NavItem } from '../sidebar-nav-item/nav-item.model';
import { BottomNavItemComponent } from '../bottom-nav-item/bottom-nav-item.component';

@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BottomNavItemComponent],
  host: {
    class: 'block shrink-0',
  },
  template: `
    <nav
      class="flex justify-around items-center h-16 bg-white border-t border-slate-200 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]"
    >
      @for (item of items(); track item.route) {
        <app-bottom-nav-item [item]="item"></app-bottom-nav-item>
      }
    </nav>
  `,
})
export class BottomNavComponent {
  items = input.required<NavItem[]>();
}
