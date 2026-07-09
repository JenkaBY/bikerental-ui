import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { userInitials } from '../../utils/user-initials.util';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center justify-center rounded-full bg-teal-600 text-white font-semibold uppercase overflow-hidden select-none {{
        sizeClass()
      }}"
      [attr.aria-label]="displayName()"
    >
      @if (photoUrl()) {
        <img [src]="photoUrl()" [alt]="displayName()" class="h-full w-full object-cover" />
      } @else {
        {{ initials() }}
      }
    </span>
  `,
})
export class UserAvatarComponent {
  displayName = input<string>('');
  photoUrl = input<string | null>(null);
  sizeClass = input<string>('h-9 w-9 text-sm');

  protected readonly initials = computed(() => userInitials(this.displayName()) || '?');
}
