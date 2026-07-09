import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Labels } from '../../constant/labels';
import { UserStore } from '../../../core/state/user.store';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    UserAvatarComponent,
  ],
  template: `
    <button
      mat-icon-button
      class="!h-9 !w-9 !p-0 !flex !items-center !justify-center"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="labels.AccountMenuAria"
      [title]="displayName()"
    >
      <app-user-avatar [displayName]="displayName()" [photoUrl]="photoUrl()" />
    </button>

    <mat-menu #menu="matMenu">
      <div class="flex items-center gap-3 px-4 py-3 min-w-56">
        <app-user-avatar
          [displayName]="displayName()"
          [photoUrl]="photoUrl()"
          sizeClass="h-10 w-10 text-base"
        />
        <div class="flex flex-col min-w-0">
          <span class="font-medium text-slate-800 truncate">{{ displayName() }}</span>
          <span class="text-sm text-slate-500 truncate">{{ secondary() }}</span>
        </div>
      </div>

      <mat-divider />

      <a mat-menu-item [routerLink]="settingsLink()">
        <mat-icon>manage_accounts</mat-icon>
        <span>{{ labels.ProfileSettingsNav }}</span>
      </a>

      <mat-divider />

      <button mat-menu-item class="text-red-600" (click)="logout.emit()">
        <mat-icon class="text-red-600">logout</mat-icon>
        <span>{{ labels.Logout }}</span>
      </button>
    </mat-menu>
  `,
})
export class ProfileMenuComponent {
  private readonly userStore = inject(UserStore);

  protected readonly labels = Labels;

  settingsLink = input<string>('/profile');
  photoUrl = input<string | null>(null);
  logout = output<void>();

  private readonly user = computed(() => this.userStore.currentUser());
  protected readonly displayName = computed(
    () => this.user()?.displayName || this.user()?.username || '',
  );
  protected readonly secondary = computed(() => {
    const user = this.user();
    return user?.email || user?.username || '';
  });
}
