# System Design: FR-02 — UserPreferences Domain Model

## 1. Architectural Overview

This story adds a single new file to the `shared` library's `core/models/` layer: `user-preferences.model.ts`. It introduces the `UserPreferences` interface and the `DEFAULT_USER_PREFERENCES` constant. No mappers, services, HTTP interactions, or new components are required — this is a pure type and constant definition that acts as the shared contract between the `UserStore` (FR-03), the persistence layer (FR-04), and any future preference-editing UI.

The `theme` field uses a closed string-literal union (`'light' | 'dark' | 'system'`) rather than an enum keyword, consistent with the existing pattern for typed object maps used elsewhere in `core/models/` (e.g. `RentalStatus`). The `language` field is an unconstrained `string` at this stage to avoid coupling the model to the specific set of compiled locales.

## 2. Impacted Components

* **`shared/core/models/` (Domain Model Layer):**
  Must receive a new `user-preferences.model.ts` file exporting the `UserPreferences` interface and the `DEFAULT_USER_PREFERENCES` `as const` object. Both must be re-exported from the layer's `index.ts` barrel and from `public-api.ts`.

* **`shared/public-api.ts` (Library Barrel):**
  Must export `UserPreferences` and `DEFAULT_USER_PREFERENCES` so that `admin`, `operator`, and `UserStore` can import them without referencing internal library paths.

## 3. Abstract Data Schema Changes

* **Entity: `UserPreferences`**
  * **Attributes Added:**
    * `language: string` — BCP-47 locale tag identifying the active UI locale (e.g. `'en-US'`, `'ru'`)
    * `theme: 'light' | 'dark' | 'system'` — controls the visual colour scheme; `'system'` defers to the OS-level preference
  * **Relations:** None — `UserPreferences` is a standalone value object stored as a signal inside `UserStore` (FR-03) and serialised to `localStorage` (FR-04); it has no foreign-key relationships

* **Constant: `DEFAULT_USER_PREFERENCES`**
  * Value: `{ language: 'en-US', theme: 'system' }`
  * Typed as `Readonly<UserPreferences>` so it cannot be mutated at runtime

## 4. Component Contracts & Payloads

* **Interaction: `UserStore` (FR-03) → `UserPreferences` default initialisation**
  * **Protocol:** In-process — `UserStore` constructor reads `DEFAULT_USER_PREFERENCES` as the fallback when no persisted value exists in `localStorage`
  * **Payload:** `{ language: 'en-US', theme: 'system' }`

* **Interaction: `localStorage` → `UserStore` (FR-04) → `UserPreferences`**
  * **Protocol:** In-process JSON deserialisation
  * **Payload:** Parsed object validated against the `UserPreferences` shape; falls back to `DEFAULT_USER_PREFERENCES` on absence or parse failure

## 5. Updated Interaction Sequence

**Happy path — first-time user (no stored preferences):**

1. `UserStore` is constructed on application bootstrap.
2. `UserStore` attempts to read `'user_preferences'` from `localStorage` — key is absent.
3. `UserStore` initialises the preferences signal with `DEFAULT_USER_PREFERENCES` (`{ language: 'en-US', theme: 'system' }`).
4. Any component reading `UserStore.preferences()` receives `{ language: 'en-US', theme: 'system' }`.

**Happy path — returning user (stored preferences exist):**

1. `UserStore` is constructed on application bootstrap.
2. `UserStore` reads and JSON-parses `'user_preferences'` from `localStorage`.
3. The parsed object satisfies the `UserPreferences` shape; it is used directly to seed the preferences signal.
4. Components immediately reflect the persisted values (e.g. `theme: 'dark'`).

## 6. Non-Functional Architecture Decisions

* **Security & Auth:**
  `UserPreferences` contains no PII and no auth-sensitive data. It is safe to persist to `localStorage` in plain JSON without encryption.

* **Scale & Performance:**
  The interface and constant are zero-runtime-cost artefacts (erased at compile time and inlined as a literal, respectively). No caching, lazy loading, or asynchronous resolution is required.
