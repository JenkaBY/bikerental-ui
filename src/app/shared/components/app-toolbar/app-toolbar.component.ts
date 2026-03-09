import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';
import { LayoutModeToggleComponent } from '../layout-mode-toggle/layout-mode-toggle.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    ToggleButtonComponent,
    LayoutModeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar
      color="primary"
      class="sticky top-0 z-20 shrink-0 flex items-center gap-2 px-4 shadow-md h-14 min-w-0"
    >
      @if (showToggle()) {
        <app-toggle-button
          [pressed]="menuOpen()"
          (toggled)="toggleSidebar.emit()"
          [showText]="false"
        ></app-toggle-button>
      }

      <span class="text-base font-medium truncate flex-1 min-w-0">{{ title() }}</span>

      @if (showDesktopModeToggle()) {
        <app-layout-mode-toggle></app-layout-mode-toggle>
      }

      <ng-content></ng-content>
    </mat-toolbar>
  `,
})
export class AppToolbarComponent {
  title = input.required<string>();

  showToggle = input<boolean>(true);

  menuOpen = input<boolean>(false);

  showLogout = input<boolean>(true);

  showDesktopModeToggle = input<boolean>(false);

  toggleSidebar = output<void>();

  logout = output<void>();
}
