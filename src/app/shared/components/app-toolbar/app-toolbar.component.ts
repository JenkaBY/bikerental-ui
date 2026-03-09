import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, ToggleButtonComponent],
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
      <ng-content></ng-content>
    </mat-toolbar>
  `,
})
export class AppToolbarComponent {
  title = input.required<string>();

  showToggle = input<boolean>(true);

  menuOpen = input<boolean>(false);

  showLogout = input<boolean>(true);

  toggleSidebar = output<void>();

  logout = output<void>();
}
