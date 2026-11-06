# User Story: FR-02 — Admin "Business settings" Page: View, Change and Reset

> **Depends on:** FR-01. **Revised 2026-11-06** to the delivered backend contract: one setting is
> changed at a time in a dialog (no draft, batch save, categories or search — the backend offers no
> batch endpoint, categories or localized labels). Implemented for `JenkaBY/bikerental-ui#171`.

## 1. Description

**As an** admin user
**I want to** see every business setting with its current value, where it comes from and its default,
and change or reset any of them
**So that** I can change how the whole rental network operates without a developer and without
silently overwriting a colleague's change

## 2. Context & Business Rules

* **Trigger:** the admin selects **"Business settings / Бизнес-настройки"** in the sidebar (last item,
  icon `tune`), which opens `/business-settings` → tab **"Settings"** (`/business-settings/values`)
* **Rules Enforced:**
  * **Page:** title "Business settings", subtitle "Rules and defaults that apply to the whole rental
    network", tabs "Settings" | "Change history" (FR-05)
  * **Table**, catalogue order, one row per setting:
    - description and, below it, the key in monospace
    - **Current value** — the effective value, formatted per kind (FR-01)
    - **Source** chip — "Set by administrator" (`BUSINESS`) or "Default" (`INSTALLATION_DEFAULT`)
    - **Default** — the installation default, formatted per kind
    - actions **Change value**, **Reset to default** (disabled when no business value is set) and
      **Show change history** (opens FR-05 filtered to this setting)
  * **Change dialog:**
    - shows the description, key, current value, default value and the rules list (FR-01, generic)
    - one input per kind: whole minutes + "min"; money with step 0.01 + the currency; single-line text
    - pre-filled with the business value, or the effective value when none is set
    - client-side validation from the rules; Save is disabled while the value is invalid or saving
    - on success: "Setting saved", the row shows the returned values, the dialog closes
    - `400 settings.value.invalid`: the violations are shown inline on the field; the dialog stays open
    - `409 settings.version.conflict` or `404 settings.key.not_editable`: a warning is shown, the
      list reloads and the dialog closes
    - any other failure: one error notification; the dialog stays open
  * **Reset:** a confirmation names the setting and its default value; on success "Setting reset to
    default" and the row shows the default; a conflict warns and reloads the list
  * **Load failure:** an error state with "Retry"
  * **Unknown value types** are listed read-only (Change disabled)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** one list request per page open; no request per keystroke
* **Security/Compliance:** admin-only route (admin app guard); version checks prevent lost updates
* **Usability/Other:** desktop-first layout consistent with other admin lists; all chrome localized
  (en + ru); errors handled locally are sent with `SUPPRESS_ERROR_NOTIFICATION` so only one message
  shows

## 4. Acceptance Criteria (BDD)

**Scenario 1: List**

* **Given** the catalogue has 8 settings
* **When** the admin opens Business settings
* **Then** 8 rows are shown with description, key, current value, source and default

**Scenario 2: Change a minutes value**

* **Given** `app.rental.time-increment` (range 1–60, default 5)
* **When** the admin changes it to 10 and saves
* **Then** "Setting saved" is shown, the row reads "10 min" with the source "Set by administrator"

**Scenario 3: Client validation**

* **When** the admin enters 90 for a setting limited to 1–60
* **Then** the field shows "Out of range: From 1 to 60." and Save is disabled

**Scenario 4: Server violation**

* **Given** a date pattern without a year
* **When** the admin saves it
* **Then** the server's `pattern_missing_part` violation is shown on the field as "The pattern is
  missing: year." and nothing is saved

**Scenario 5: Stale edit**

* **Given** another admin changed the same setting after the list loaded
* **When** the admin saves
* **Then** a warning says another administrator changed it, the list reloads and the dialog closes

**Scenario 6: Reset**

* **Given** a setting with a business value
* **When** the admin resets it and confirms
* **Then** the row shows the default value with the source "Default", and Reset becomes disabled

## 5. Out of Scope

* Rental-point level (FR-03, deferred); operator app (FR-04, deferred)
* Categories, search, draft / batch save, leave-page guard (not supported by the backend contract)
* Applying the settings in business flows (later tasks)
* Test files (MVP rule)
