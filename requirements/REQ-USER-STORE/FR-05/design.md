# System Design: FR-05 — Language Switch Locale Redirect

## 1. Architectural Overview

This story introduces one new artefact — `LocaleRedirectService` in `shared/core/` — and modifies `UserStore` (`updatePreferences`) to call it when the requested language differs from the currently active locale. No new components or HTTP interactions are required.

Angular's compile-time i18n produces two independent static builds per app. For `admin`: English is served at `/admin/` (baseHref as-is for the source locale `en-US`) and Russian at `/ru/admin/` (Angular prepends the locale segment). For `operator` the same pattern applies: `/operator/` and `/ru/operator/`. A full browser page reload to the locale-specific base URL is the only mechanism available; runtime string switching without reload is explicitly out of scope.

`LocaleRedirectService` owns all URL construction logic, injects Angular's `LOCALE_ID` token to detect the active locale, and uses a single internal allow-listed map to translate a locale tag to its URL path prefix. This keeps `UserStore` free of window-manipulation concerns and makes the redirect logic independently testable.

## 2. Impacted Components

* **`shared/core/` (new file: `locale-redirect.service.ts`):**
  A new `@Injectable({ providedIn: 'root' })` service that:
  - Injects `LOCALE_ID` to read the currently active compiled locale
  - Holds an internal `SUPPORTED_LOCALE_PREFIX` allow-listed map (`'en-US'` / `'en'` → `''`, `'ru'` → `'/ru'`)
  - Exposes a single method `redirect(targetLocale: string): void` that constructs the target URL, validates it against the allow-list, and performs `window.location.assign(targetUrl)` only for supported locales
  - Takes no action and throws no error for unsupported locale tags

* **`shared/core/state/user.store.ts` (modified):**
  `updatePreferences()` gains a call to `LocaleRedirectService.redirect(patch.language)` after persisting the preference change, but only when `patch.language` is present and differs from `preferences().language`. The store does not call `window.location` directly.

* **`shared/public-api.ts` (Library Barrel):**
  Must export `LocaleRedirectService` so that `admin` and `operator` apps can inject it independently if needed (e.g. for testing or future standalone use).

## 3. Abstract Data Schema Changes

No data schema changes. The allow-listed locale-to-prefix map is a compile-time constant internal to `LocaleRedirectService`:

| Locale tag         | Path prefix  | Example admin URL     |
|--------------------|--------------|-----------------------|
| `'en-US'` / `'en'` | `''` (empty) | `/admin/dashboard`    |
| `'ru'`             | `'/ru'`      | `/ru/admin/dashboard` |

## 4. Component Contracts & Payloads

* **Interaction: `UserStore.updatePreferences()` → `LocaleRedirectService`**
  * **Protocol:** In-process method call
  * **Trigger condition:** `patch.language` is defined AND differs from `this._preferences().language`
  * **Payload:** `targetLocale: string` — the new locale tag from the preference patch

* **Interaction: `LocaleRedirectService` → Browser Navigation**
  * **Protocol:** `window.location.assign(targetUrl)` — causes a full page load; does not return
  * **URL construction:**
    1. Look up `targetLocale` in the allow-listed prefix map; if absent, return without navigating
    2. Look up the current active locale's prefix via the same map
    3. Replace the current prefix in `window.location.pathname` with the new prefix
    4. Combine with `window.location.origin` to form an absolute URL
  * **Security constraint:** The target URL is assembled from `window.location.origin` (trusted browser property) plus a path built exclusively from allow-listed prefix segments and the sanitised current `pathname` — no raw user input is ever interpolated into the URL

* **Interaction: Browser reload → `UserStore` constructor (FR-04)**
  * After the reload, `UserStore` reads `language` from `localStorage` (written by FR-04 `effect()`); the preference is already set to the new locale before the redirect fires, so it is available immediately on the next bootstrap

## 5. Updated Interaction Sequence

**Happy path — switching from English to Russian:**

1. User selects Russian from the language-switcher UI.
2. Component calls `UserStore.updatePreferences({ language: 'ru' })`.
3. `UserStore` merges the patch; `_preferences` signal updates to `{ ..., language: 'ru' }`.
4. FR-04 `effect()` fires; `localStorage` is updated with `{ "language": "ru", "theme": "..." }`.
5. `UserStore.updatePreferences()` detects `'ru' !== currentActiveLocale` and calls `LocaleRedirectService.redirect('ru')`.
6. `LocaleRedirectService` looks up `'ru'` → prefix `'/ru'`; looks up current locale `'en-US'` → prefix `''`.
7. Current `pathname` `/admin/dashboard` has the `''` prefix stripped (no-op) → `/admin/dashboard`.
8. New URL assembled: `https://host/ru/admin/dashboard`.
9. `window.location.assign('https://host/ru/admin/dashboard')` is called; page reloads.
10. On reload, `UserStore` reads `language: 'ru'` from `localStorage`; the Russian build is served at `/ru/admin/`; all UI strings render in Russian.

**Happy path — selecting the same locale (no-op):**

1. User selects English while already on the English locale.
2. Component calls `UserStore.updatePreferences({ language: 'en-US' })`.
3. `UserStore` detects `'en-US' === currentActiveLocale`; skips the redirect call.
4. Preference is updated in the signal and persisted to `localStorage`; no navigation occurs.

**Unhappy path — unsupported locale tag:**

1. `updatePreferences({ language: 'zh-CN' })` is called.
2. `UserStore` persists `language: 'zh-CN'` to the preferences signal and `localStorage`.
3. `UserStore` calls `LocaleRedirectService.redirect('zh-CN')`.
4. `LocaleRedirectService` looks up `'zh-CN'` in the allow-listed map — not found; method returns without calling `window.location.assign`.
5. The application remains on the current locale; no runtime error is thrown.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:**
  The redirect target is constructed exclusively from allow-listed path prefixes and the browser's own `window.location.origin` + `pathname`. No portion of the locale string supplied by the caller is ever directly concatenated into the URL. Locales not present in the allow-list are silently ignored, eliminating open-redirect risk from unsupported or attacker-supplied locale values.

* **Scale & Performance:**
  The allow-listed map lookup is O(1). The service performs at most one `window.location.assign` per language-selection interaction; no debounce or rate-limiting is needed. The preference is written to `localStorage` before the redirect so it is always available on the next bootstrap regardless of timing.
