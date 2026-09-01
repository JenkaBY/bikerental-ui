import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { UserPreferences, UserSettings } from '@ui-models';
import { catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';
import { UsersService } from '../api/generated';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  NotificationService,
  suppressErrorNotification,
} from '../errors';
import { UserSettingsMapper } from '../mappers';
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
  private readonly users = inject(UsersService);
  private readonly notifications = inject(NotificationService);
  private readonly errorMessages = inject(ErrorMessageResolver);
  private readonly stubMode = inject(PROFILE_STUB_MODE);

  private readonly _saving = signal(false);
  private readonly _savingPreferences = signal(false);
  readonly saving = computed(() => this._saving());
  readonly savingPreferences = computed(() => this._savingPreferences());

  saveProfile(patch: ProfilePatch): void {
    const current = this.userStore.currentUser();
    if (!current) {
      return;
    }
    // TODO: swap for PUT /api/auth/me when the backend adds it — the UI stays unchanged.
    this.userStore.setUser({ ...current, email: patch.email, displayName: patch.displayName });
    this.notifications.success(Labels.ProfileSaved);
  }

  savePreferences(patch: Partial<UserPreferences>): Observable<UserSettings> {
    const request = UserSettingsMapper.toRequest(patch);

    if (this.stubMode) {
      const settings = { ...this.userStore.settings(), ...stripRemovedKeys(request) };
      this.userStore.applySettings(settings);
      return of(settings);
    }

    this._savingPreferences.set(true);

    return this.users
      .updateSettings(request, 'body', { context: suppressErrorNotification() })
      .pipe(
        map((response) => UserSettingsMapper.fromResponse(response)),
        tap((settings) => this.userStore.applySettings(settings)),
        catchError((error: unknown) => {
          this.notifications.error(this.describeSettingsError(error));
          return throwError(() => error);
        }),
        finalize(() => this._savingPreferences.set(false)),
      );
  }

  changePassword(input: ChangePasswordInput): Observable<void> {
    this._saving.set(true);

    if (this.stubMode) {
      this._saving.set(false);
      return of(undefined);
    }

    return this.users
      .changePassword(input, 'response', { context: suppressErrorNotification() })
      .pipe(
        map(() => undefined),
        finalize(() => this._saving.set(false)),
      );
  }

  // The backend reports a rejected setting as a field error on `settings`, not as a response
  // code, so prefer the field-level copy over the generic "parameters are invalid" fallback.
  private describeSettingsError(error: unknown): string {
    const apiError = ApiErrorParser.parse(error);
    const fieldError = apiError.fieldErrors[0];
    return fieldError
      ? this.errorMessages.resolveField(fieldError)
      : this.errorMessages.resolve(apiError);
  }
}

function stripRemovedKeys(patch: Record<string, string | null>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== null) {
      result[key] = value;
    }
  }
  return result;
}
