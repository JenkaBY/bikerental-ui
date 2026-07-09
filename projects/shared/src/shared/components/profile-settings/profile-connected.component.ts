import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-profile-connected',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <div class="flex flex-col gap-1 p-3 md:p-4 max-w-xl">
      <div class="flex items-center gap-3 py-2">
        <svg viewBox="0 0 48 48" class="h-7 w-7 shrink-0" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.3C29.3 35.4 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.3C39.9 36.9 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
          />
        </svg>
        <div class="flex flex-col flex-1 min-w-0">
          <span class="font-medium text-slate-800 truncate">{{ labels.ProfileGoogleTitle }}</span>
          <span class="text-sm text-slate-500 truncate">{{ labels.ProfileNotConnected }}</span>
        </div>
        <button mat-stroked-button type="button" disabled>
          {{ labels.ProfileGoogleConnect }}
        </button>
      </div>
    </div>
  `,
})
export class ProfileConnectedComponent {
  protected readonly labels = Labels;
}
