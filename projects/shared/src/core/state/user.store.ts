import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { UserPreferences, UserProfile, UserSettings } from '@ui-models';
import { UserSettingsMapper } from '../mappers/user-settings.mapper';
import { LocaleRedirectService } from '../locale-redirect.service';

const SETTINGS_STORAGE_KEY = 'user_settings';
const LEGACY_PREFERENCES_STORAGE_KEY = 'user_preferences';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly _currentUser = signal<UserProfile | null>(null);
  private readonly _settings = signal<UserSettings>(this.readCache());
  private readonly localeRedirect = inject(LocaleRedirectService);

  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRoles = computed(() => this._currentUser()?.roles ?? []);
  readonly settings = computed(() => this._settings());
  readonly preferences = computed<UserPreferences>(() =>
    UserSettingsMapper.toPreferences(this._settings()),
  );
  readonly locale = computed(() => this.preferences().language);

  constructor() {
    effect(() => {
      const settings = this._settings();
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Cache is best-effort — the server stays the source of truth.
      }
    });
  }

  setUser(profile: UserProfile): void {
    this._currentUser.set(profile);
  }

  clearUser(): void {
    this._currentUser.set(null);
  }

  applySettings(settings: UserSettings): void {
    this._settings.set(settings);
    this.localeRedirect.redirect(this.locale());
  }

  private readCache(): UserSettings {
    try {
      localStorage.removeItem(LEGACY_PREFERENCES_STORAGE_KEY);
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored === null ? {} : UserSettingsMapper.fromResponse(JSON.parse(stored));
    } catch {
      return {};
    }
  }
}
