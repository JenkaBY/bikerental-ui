# User Story: FR-02 — UserPreferences Domain Model

## 1. Description

**As a** developer
**I want to** have a typed `UserPreferences` interface and a `DEFAULT_USER_PREFERENCES` constant in the shared library
**So that** the `UserStore` has a stable, typed contract for the persisted preference data and all consumers share the same defaults

## 2. Context & Business Rules

* **Trigger:** The `UserStore` needs to initialise preferences and write/read them from `localStorage`
* **Rules Enforced:**
  * `UserPreferences` has exactly two fields: `language: string` (BCP-47 locale tag, e.g. `'en-US'`, `'ru'`) and `theme: 'light' | 'dark' | 'system'`
  * `DEFAULT_USER_PREFERENCES` constant must be: `{ language: 'en-US', theme: 'system' }`
  * Both `UserPreferences` and `DEFAULT_USER_PREFERENCES` must be exported from the shared library's `public-api.ts` barrel

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — pure type and constant definition
* **Security/Compliance:** No PII in preferences; `language` and `theme` are non-sensitive display settings
* **Usability/Other:** `theme: 'system'` default means the app follows the OS preference out-of-the-box for first-time users

## 4. Acceptance Criteria (BDD)

**Scenario 1: UserPreferences interface has the correct fields and types**

* **Given** the `UserPreferences` interface exported from the shared library
* **When** a developer imports it
* **Then** TypeScript enforces `language: string` and `theme: 'light' | 'dark' | 'system'`; no other fields exist

**Scenario 2: DEFAULT_USER_PREFERENCES matches the specification**

* **Given** the `DEFAULT_USER_PREFERENCES` constant
* **When** a developer reads its value
* **Then** `language` equals `'en-US'` and `theme` equals `'system'`

**Scenario 3: Invalid theme value is rejected at compile time**

* **Given** a value typed as `UserPreferences`
* **When** a developer attempts to assign `theme: 'blue'`
* **Then** TypeScript raises a compile-time type error

## 5. Out of Scope

* Additional preference fields beyond `language` and `theme` (future stories may extend the interface)
* Validation logic for locale tag format — `language` is an unconstrained string at this stage
