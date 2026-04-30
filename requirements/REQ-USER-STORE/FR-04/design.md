# System Design: FR-04 — Preferences Persistence to localStorage

## 1. Architectural Overview

This story augments `UserStore` (FR-03) with two behaviours: seed-on-construction (read from `localStorage` at startup) and write-on-change (persist to `localStorage` via `effect()` whenever the private preferences signal mutates). No new files, components, or services are introduced — all changes are contained within `user.store.ts`.

The read path runs synchronously inside the store constructor: a `try/catch` block attempts `JSON.parse` on the stored string; any failure silently yields `DEFAULT_USER_PREFERENCES`. The write path is an Angular `effect()` registered in the constructor that reacts to the private `_preferences` signal and calls `localStorage.setItem` with the JSON-serialised current value. Identity data (`UserProfile`) is explicitly excluded from any `localStorage` interaction.

## 2. Impacted Components

* **`shared/core/state/user.store.ts` (modified):**
  * Constructor gains a `localStorage` read with `try/catch` fallback to seed `_preferences`
  * Constructor gains an `effect()` that writes `_preferences` to `localStorage` on every change
  * No changes to the store's public API — all signals and mutation methods defined in FR-03 remain identical

## 3. Abstract Data Schema Changes

* **`localStorage` key: `'user_preferences'`**
  * **Value format:** JSON string serialisation of `UserPreferences` — `{ "language": "...", "theme": "..." }`
  * **Written by:** `effect()` inside `UserStore` constructor, triggered on every `_preferences` signal change
  * **Read by:** `UserStore` constructor synchronously on application bootstrap
  * **Absent/invalid handling:** Falls back to `DEFAULT_USER_PREFERENCES`; key is written on the next `_preferences` change (i.e. after the first `updatePreferences()` call or on initial `effect()` run)

No other `localStorage` keys are introduced. No `UserProfile` fields are written to `localStorage`.

## 4. Component Contracts & Payloads

* **Interaction: `UserStore` constructor → `localStorage` (read)**
  * **Protocol:** Synchronous browser storage API call (`localStorage.getItem`)
  * **Key:** `'user_preferences'`
  * **Success payload:** Parsed `UserPreferences` object used to seed `_preferences` signal
  * **Failure payload (null or invalid JSON):** `DEFAULT_USER_PREFERENCES` used as fallback; no error propagated

* **Interaction: `effect()` inside `UserStore` → `localStorage` (write)**
  * **Protocol:** Synchronous browser storage API call (`localStorage.setItem`)
  * **Key:** `'user_preferences'`
  * **Payload:** `JSON.stringify(this._preferences())` — serialised `UserPreferences`
  * **Trigger:** Fires once immediately on construction (writing defaults if no stored value existed) and on every subsequent `_preferences` signal mutation

## 5. Updated Interaction Sequence

**Happy path — returning user (stored preferences exist):**

1. Application bootstraps; Angular constructs `UserStore` via DI.
2. Constructor calls `localStorage.getItem('user_preferences')`.
3. A valid JSON string is found; `JSON.parse` succeeds and returns a `UserPreferences`-shaped object.
4. `_preferences` signal is initialised with the parsed object.
5. The persistence `effect()` is registered and fires immediately — `localStorage` is overwritten with the same value (no visible change).
6. `preferences()` computed signal reflects the restored values; all components reading it see the correct state immediately.

**Happy path — first-time / cleared preferences:**

1. Application bootstraps; `UserStore` constructor runs.
2. `localStorage.getItem('user_preferences')` returns `null`.
3. Constructor falls back to `DEFAULT_USER_PREFERENCES` to seed `_preferences`.
4. The persistence `effect()` fires immediately and writes `'{"language":"en-US","theme":"system"}'` to `localStorage`.
5. Subsequent page reloads follow the "returning user" path above.

**Unhappy path — corrupted stored value:**

1. Application bootstraps; `UserStore` constructor runs.
2. `localStorage.getItem('user_preferences')` returns a non-JSON string (e.g. `'not-valid-json'`).
3. `JSON.parse` throws inside `try/catch`; the `catch` block silently yields `DEFAULT_USER_PREFERENCES`.
4. `_preferences` is seeded with defaults; the persistence `effect()` immediately overwrites the corrupted entry with valid JSON.
5. No runtime error is propagated; the application starts normally.

**Happy path — preference update after bootstrap:**

1. User selects a different theme; component calls `UserStore.updatePreferences({ theme: 'dark' })`.
2. `_preferences` is updated to `{ language: 'en-US', theme: 'dark' }`.
3. The persistence `effect()` fires; `localStorage.setItem('user_preferences', '{"language":"en-US","theme":"dark"}')` is called.
4. On the next page reload, step 3 of the "returning user" path restores `theme: 'dark'`.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:**
  Only `language` (a locale string) and `theme` (a display setting) are written to `localStorage`. No PII, no auth tokens, and no `UserProfile` fields are persisted. `setUser()` and `clearUser()` do not interact with `localStorage` at all.

* **Scale & Performance:**
  The `effect()` writes at most once per signal mutation — Angular's reactivity scheduler batches synchronous updates, so multiple rapid calls to `updatePreferences()` within the same microtask result in a single `localStorage.setItem` call. The constructor read is a single synchronous `localStorage.getItem` call that completes in microseconds and does not block the bootstrap render.
