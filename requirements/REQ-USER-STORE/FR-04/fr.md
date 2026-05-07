# User Story: FR-04 — Preferences Persistence to localStorage

## 1. Description

**As a** user of the admin or operator app
**I want** my theme and language preferences to be remembered between sessions
**So that** I do not have to reconfigure them every time I open the application

## 2. Context & Business Rules

* **Trigger:** The `UserStore` is constructed (app startup) and whenever `updatePreferences()` is called
* **Rules Enforced:**
  * Preferences must be stored in `localStorage` under a fixed key (e.g. `'user_preferences'`)
  * The stored value is a JSON-serialised `UserPreferences` object
  * On store construction, the store must attempt to read and parse the `localStorage` value; if the value is absent or cannot be parsed as valid `UserPreferences`, it must fall back to `DEFAULT_USER_PREFERENCES` silently (no thrown error)
  * Persistence must be implemented with an `effect()` that reacts to changes in the private preferences signal — not inside `updatePreferences()` directly
  * Identity data (`UserProfile`) must **not** be persisted to `localStorage` by the store

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Reading/writing `localStorage` must occur at most once per preference change; `effect()` prevents writes on every change detection cycle
* **Security/Compliance:** No PII and no auth tokens are written to `localStorage` by this store; only `language` and `theme` values are stored
* **Usability/Other:** Corrupted or missing `localStorage` data must never crash the application — the fallback to defaults must be silent

## 4. Acceptance Criteria (BDD)

**Scenario 1: Preferences survive a page refresh**

* **Given** a user sets `theme: 'dark'` via `updatePreferences({ theme: 'dark' })`
* **When** the user refreshes the browser page
* **Then** `preferences().theme` equals `'dark'` immediately after the store is re-constructed — before any user interaction

**Scenario 2: Missing localStorage entry falls back to defaults**

* **Given** there is no `'user_preferences'` key in `localStorage`
* **When** the store is constructed
* **Then** `preferences()` equals `DEFAULT_USER_PREFERENCES` (`{ language: 'en-US', theme: 'system' }`)

**Scenario 3: Corrupted localStorage entry falls back to defaults**

* **Given** `localStorage.getItem('user_preferences')` returns the string `'not-valid-json'`
* **When** the store is constructed
* **Then** `preferences()` equals `DEFAULT_USER_PREFERENCES` and no runtime error is thrown

**Scenario 4: Only preferences are written to localStorage — not identity**

* **Given** `setUser()` is called with a `UserProfile`
* **When** `localStorage` is inspected
* **Then** there is no entry containing `UserProfile` data (no `email`, `firstName`, etc.)

## 5. Out of Scope

* Server-side preference sync — preferences are local-browser only at this stage
* Preference migration logic for future schema changes to `UserPreferences`
* Encryption of the stored preferences value
