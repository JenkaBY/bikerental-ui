# User Story: FR-05 — Language Switch Locale Redirect

## 1. Description

**As a** user of the admin or operator app
**I want to** switch the application language at runtime
**So that** the entire UI is displayed in my preferred language without needing to manually navigate to a different URL

## 2. Context & Business Rules

* **Trigger:** A user selects a different locale from a language-switcher UI control
* **Rules Enforced:**
  * Angular's compile-time i18n is used; each locale is a separate static build served at a locale-specific base URL (e.g. `/admin/` for English, `/ru/admin/` for Russian)
  * When `updatePreferences({ language })` is called with a locale that differs from the currently active runtime locale, the application must persist the new locale preference and perform a **full browser page reload** to the equivalent URL under the new locale's base path
  * If the requested locale equals the current active locale, no navigation or reload occurs
  * The mapping from locale tag to base-href path segment must be defined in a single, central location (not duplicated across components)
  * The store must not itself directly manipulate `window.location`; the locale-redirect logic must be encapsulated in a dedicated service or utility so it can be tested and replaced independently
  * After the reload, the newly constructed store reads the saved `language` preference from `localStorage` (FR-04) and the app serves content in the correct locale

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The reload happens at most once per language selection; no polling or debounce is required
* **Security/Compliance:** The target URL is derived from a fixed, allow-listed mapping of supported locales — it must not be constructed from raw user input to prevent open-redirect vulnerabilities
* **Usability/Other:** The user is taken to the same logical page in the new locale (e.g., if on the admin dashboard, they land on the admin dashboard in Russian)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Switching from English to Russian triggers a locale reload**

* **Given** the user is on the English locale (`/admin/dashboard`)
* **When** `updatePreferences({ language: 'ru' })` is called
* **Then** the browser navigates to the Russian locale equivalent (e.g. `/ru/admin/dashboard`) and the page reloads

**Scenario 2: Switching to the same locale does not trigger a reload**

* **Given** the user is already on the English locale
* **When** `updatePreferences({ language: 'en-US' })` is called
* **Then** no page reload or navigation occurs; `preferences().language` remains `'en-US'`

**Scenario 3: After reload, the correct locale is active**

* **Given** the user switched to Russian (scenario 1)
* **When** the page finishes loading at the Russian locale URL
* **Then** all static UI strings are rendered in Russian

**Scenario 4: Unsupported locale is ignored gracefully**

* **Given** a developer or external caller passes an unsupported locale tag (e.g. `'zh-CN'`)
* **When** `updatePreferences({ language: 'zh-CN' })` is called
* **Then** the preference is stored but no redirect occurs (the app stays on the current locale), and no runtime error is thrown

## 5. Out of Scope

* The UI component (dropdown, menu) that exposes the language switcher to the user — this is a separate UI story
* Adding new locale translations or XLF message files
* Runtime i18n without a page reload (not supported by this architecture)
