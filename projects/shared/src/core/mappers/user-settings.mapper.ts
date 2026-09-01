import {
  DEFAULT_USER_PREFERENCES,
  Theme,
  UserPreferences,
  UserSettingKey,
  UserSettings,
  UserSettingsPatch,
} from '@ui-models';
import type { UserResponse } from '../api/generated';

const THEMES: readonly string[] = ['light', 'dark', 'system'];

export class UserSettingsMapper {
  static fromUserResponse(response: UserResponse): UserSettings {
    return this.fromResponse(response.settings);
  }

  static fromResponse(settings: Record<string, unknown> | null | undefined): UserSettings {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings ?? {})) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return result;
  }

  static toPreferences(settings: UserSettings): UserPreferences {
    const theme = settings[UserSettingKey.Theme];
    return {
      language: settings[UserSettingKey.Locale] ?? DEFAULT_USER_PREFERENCES.language,
      theme: THEMES.includes(theme) ? (theme as Theme) : DEFAULT_USER_PREFERENCES.theme,
    };
  }

  static toRequest(patch: Partial<UserPreferences>): UserSettingsPatch {
    const request: UserSettingsPatch = {};
    if ('language' in patch) {
      request[UserSettingKey.Locale] = patch.language ?? null;
    }
    if ('theme' in patch) {
      request[UserSettingKey.Theme] = patch.theme ?? null;
    }
    return request;
  }
}
