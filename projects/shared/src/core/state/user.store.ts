import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DEFAULT_USER_PREFERENCES, UserPreferences, UserProfile } from '@ui-models';
import { LocaleRedirectService } from '../locale-redirect.service';

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

  // TODO: temporary dev seed for the operator app until its OIDC auth lands.
  seedDevUser(): void {
    this._currentUser.set({
      id: '00000000-0000-0000-0000-000000000000',
      username: 'dev-operator',
      email: '',
      displayName: 'Dev Operator',
      roles: ['OPERATOR'],
      isAdmin: false,
      isOperator: true,
      mustChangePassword: false,
      status: 'ACTIVE',
    });
  }
}
