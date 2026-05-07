import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DEFAULT_USER_PREFERENCES, UserPreferences, UserProfile } from '@ui-models';
import { LocaleRedirectService } from '../locale-redirect.service';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UserProfileMapper, UserProfileResponse } from '../mappers';

const PREFERENCES_STORAGE_KEY = 'user_preferences';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly _currentUser = signal<UserProfile | null>(null);
  private readonly _preferences = signal<UserPreferences>(DEFAULT_USER_PREFERENCES);
  private readonly localeRedirect = inject(LocaleRedirectService);

  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRoles = computed(() => this._currentUser()?.roles ?? []);
  readonly preferences = computed(() => this._preferences());

  constructor() {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored !== null) {
        this._preferences.set(JSON.parse(stored) as UserPreferences);
      }
    } catch {
      // Silently fall back to DEFAULT_USER_PREFERENCES
    }

    effect(() => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this._preferences()));
    });
  }

  login(): Observable<void> {
    const fakeAdmin = {
      firstName: 'IliveInUserStore',
      lastName: 'DeleteMe',
      roles: ['ADMIN'],
      email: 'fake_email@gmail.com',
      id: '00000000-0000-0000-0000-000000000000',
    } as UserProfileResponse;

    return of(fakeAdmin).pipe(
      map((response) => UserProfileMapper.fromResponse(response)),
      tap((user) => {
        this._currentUser.set(user);
      }),
      map(() => undefined),
      catchError(() => {
        return EMPTY;
      }),
    );
  }

  setUser(profile: UserProfile): void {
    this._currentUser.set(profile);
  }

  clearUser(): void {
    this._currentUser.set(null);
  }

  updatePreferences(patch: Partial<UserPreferences>): void {
    const currentLanguage = this._preferences().language;
    this._preferences.update((current) => ({ ...current, ...patch }));
    if (patch.language !== undefined && patch.language !== currentLanguage) {
      this.localeRedirect.redirect(patch.language);
    }
  }
}
