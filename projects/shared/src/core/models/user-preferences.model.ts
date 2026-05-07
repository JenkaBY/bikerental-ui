export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  language: string;
  theme: Theme;
}

export const DEFAULT_USER_PREFERENCES: Readonly<UserPreferences> = {
  language: 'en-US',
  theme: 'system',
} as const;
