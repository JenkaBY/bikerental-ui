import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { UserPreferences, UserProfile, UserSettings } from '@ui-models';
import { UserSettingsMapper } from '../mappers/user-settings.mapper';
import { LocaleRedirectService } from '../locale-redirect.service';
import { DeployedPath } from '../../shared/utils/deployed-path';

const SETTINGS_STORAGE_PREFIX = 'user_settings';

function settingsStorageKey(): string {
  const slug = DeployedPath.fromBase(document.baseURI).slug;
  return slug ? `${SETTINGS_STORAGE_PREFIX}:${slug}` : SETTINGS_STORAGE_PREFIX;
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly storageKey = settingsStorageKey();
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
  readonly workingPointSlug = computed(() => UserSettingsMapper.workingPointSlug(this._settings()));
  readonly locale = computed(() => this.preferences().language);

  constructor() {
    effect(() => {
      const settings = this._settings();
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(settings));
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
    this._settings.set({});
  }

  applySettings(settings: UserSettings): void {
    this._settings.set(settings);
    this.localeRedirect.redirect(this.locale());
  }

  private readCache(): UserSettings {
    try {
      if (this.storageKey !== SETTINGS_STORAGE_PREFIX) {
        localStorage.removeItem(SETTINGS_STORAGE_PREFIX);
      }
      const stored = localStorage.getItem(this.storageKey);
      return stored === null ? {} : UserSettingsMapper.fromResponse(JSON.parse(stored));
    } catch {
      return {};
    }
  }
}
