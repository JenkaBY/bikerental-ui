import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NavItem } from '../sidebar-nav-item/nav-item.model';
import { SidebarNavItemComponent } from '../sidebar-nav-item/sidebar-nav-item.component';
import { AppBrandComponent } from '../app-brand/app-brand.component';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, MatIconModule, SidebarNavItemComponent, AppBrandComponent],
  template: `
    <div class="flex flex-col h-full">
      <app-brand [brand]="brand()"></app-brand>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <mat-nav-list class="mt-2 px-2">
          @for (item of items(); track item.route) {
            <app-sidebar-nav-item [item]="item" />
          }
        </mat-nav-list>
      </div>

      <ng-content select="[sidebar-footer]"></ng-content>
    </div>
  `,
})
export class SidebarComponent {
  items = input<NavItem[]>([]);
  brand = input<string>();
}
