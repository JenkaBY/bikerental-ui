# Initial User Request — REQ-USER-STORE

## Original Request

> I want to create a global userStore to store user logged in, user's preferences like language and others. It will be filled with data once the user has logged in into the app.

## Clarifications Gathered

| Question                     | Answer                                                                                |
|------------------------------|---------------------------------------------------------------------------------------|
| User data fields             | Full `UserProfile` placeholder: `email`, `roles: string[]`, `firstName`, `lastName`   |
| Preferences to include       | `language` (locale) and UI `theme` (`light` / `dark` / `system`)                      |
| Preferences persistence      | Persist to `localStorage`; restore on page load                                       |
| Language switching mechanism | Full page reload to locale-specific URL (Angular compile-time i18n standard approach) |
| Target apps                  | `admin` and `operator` SPAs only (via the `shared` library)                           |
