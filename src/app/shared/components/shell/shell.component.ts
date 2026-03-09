import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AppToolbarComponent } from '../app-toolbar/app-toolbar.component';
import { NavItem } from '../sidebar-nav-item/nav-item.model';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    SidebarComponent,
    AppToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="h-screen min-h-screen overflow-hidden" style="height: 100vh">
      @if (hasSidebar()) {
        <mat-sidenav
          mode="side"
          [opened]="effectiveOpened()"
          class="sidenav-with-status w-72 bg-slate-50 border-r border-slate-200"
        >
          <div class="sidenav-inner flex flex-col h-full min-h-0">
            <div class="flex-1 min-h-0 overflow-y-auto pb-12">
              <app-sidebar [items]="items() ?? []" [brand]="brand()"> </app-sidebar>
            </div>
            <div
              class="sidebar-status-footer shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-100"
            >
              <ng-content select="[sidebar-footer]"></ng-content>
            </div>
          </div>
        </mat-sidenav>
      }

      <mat-sidenav-content class="flex flex-col min-h-0 min-w-0 h-full">
        <app-toolbar
          [title]="title()"
          [showToggle]="hasSidebar()"
          [menuOpen]="effectiveOpened()"
          (toggleSidebar)="onToggleSidebar()"
          (logout)="logout.emit()"
        >
          <ng-content select="[toolbar-actions]"></ng-content>
        </app-toolbar>

        <main class="flex-1 overflow-auto bg-white w-full">
          <div class="p-6 min-h-full">
            <ng-content></ng-content>
          </div>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class ShellComponent {
  items = input<NavItem[] | undefined>(undefined);
  brand = input<string | undefined>(undefined);
  title = input<string>('');
  hasSidebar = computed(() => Array.isArray(this.items()));

  private _opened = signal(true);
  sidenavOpened = input<boolean | undefined>(undefined);

  // Expose a computed that resolves to the provided input or local state
  effectiveOpened = computed(() => {
    const external = this.sidenavOpened();
    return typeof external === 'boolean' ? external : this._opened();
  });

  protected onToggleSidebar() {
    // If consumer provided an external boolean signal, we only emit toggle event
    const external = this.sidenavOpened();
    if (typeof external === 'boolean') {
      this.toggleSidebar.emit();
      return;
    }

    this._opened.update((v) => !v);
    this.toggleSidebar.emit();
  }

  toggleSidebar = output<void>();
  logout = output<void>();
}
