import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { finalize, map, Observable, of } from 'rxjs';
import { IdentityService } from '../api/generated';
import { NotificationService, suppressErrorNotification } from '../errors';
import { Labels } from '../../shared/constant/labels';
import { UserStore } from './user.store';

// Operator has no auth yet; providing `true` makes profile actions run offline (no network).
// Remove the operator provider once operator auth lands — the profile UI stays unchanged.
export const PROFILE_STUB_MODE = new InjectionToken<boolean>('PROFILE_STUB_MODE', {
  providedIn: 'root',
  factory: () => false,
});

export interface ProfilePatch {
  email: string;
  displayName: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly userStore = inject(UserStore);
  private readonly identity = inject(IdentityService);
  private readonly notifications = inject(NotificationService);
  private readonly stubMode = inject(PROFILE_STUB_MODE);

  private readonly _saving = signal(false);
  readonly saving = computed(() => this._saving());

  saveProfile(patch: ProfilePatch): void {
    const current = this.userStore.currentUser();
    if (!current) {
      return;
    }
    // TODO: swap for PUT /api/auth/me when the backend adds it — the UI stays unchanged.
    this.userStore.setUser({ ...current, email: patch.email, displayName: patch.displayName });
    this.notifications.success(Labels.ProfileSaved);
  }

  changePassword(input: ChangePasswordInput): Observable<void> {
    this._saving.set(true);

    if (this.stubMode) {
      this._saving.set(false);
      return of(undefined);
    }

    return this.identity
      .changePassword(input, 'response', { context: suppressErrorNotification() })
      .pipe(
        map(() => undefined),
        finalize(() => this._saving.set(false)),
      );
  }
}
