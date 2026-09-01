export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  language: string;
  theme: Theme;
}

export type UserSettings = Readonly<Record<string, string>>;

export type UserSettingsPatch = Record<string, string | null>;

export const UserSettingKey = {
  Locale: 'locale',
  Theme: 'theme',
} as const;

export const DEFAULT_USER_PREFERENCES: Readonly<UserPreferences> = {
  language: 'en',
  theme: 'system',
} as const;
