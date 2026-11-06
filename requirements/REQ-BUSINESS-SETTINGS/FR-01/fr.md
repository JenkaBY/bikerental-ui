# User Story: FR-01 — Business Settings Foundation (Catalogue Contract, Value Kinds, Generic Rules)

> Foundation story for REQ-BUSINESS-SETTINGS. It delivers no screen by itself; FR-02 and FR-05 build
> on it. **Revised 2026-11-06** to the backend contract delivered in `JenkaBY/bike-rental` #331–#334
> (handoff `JenkaBY/bikerental-ui#171`). The earlier concept (categories, localized labels,
> per-point overrides, one batch save) is **not** what the backend ships; the parts of it that still
> apply later are kept in FR-03 (points) and FR-04 (operator), both deferred.

## 1. Description

**As a** product owner of the rental network
**I want** business settings to be described by a backend-owned catalogue and handled by the front
end as typed, data-driven entries rather than one hand-built field per setting
**So that** a new setting of an existing value type needs only a backend change, with no front-end
release

## 2. Context & Business Rules

* **Trigger:** any front-end feature that reads or changes business settings
* **Backend contract (delivered):**

  | What | Endpoint | Shape |
  |------|----------|-------|
  | List | `GET /api/business-settings` | list of `SettingView`, catalogue order (operators and administrators) |
  | Change | `PUT /api/business-settings/{key}` | `{level, pointSlug?, value, expectedVersion}` → `SettingView` (admin) |
  | Reset | `POST /api/business-settings/{key}/resets` | `{level, pointSlug?, expectedVersion}` → `SettingView` (admin) |
  | History | `GET /api/business-settings/changes` | page of `SettingChangeView` (admin) — FR-05 |
  | Authors | `GET /api/auth/users?ids=a,b` | users for the given ids (admin) — FR-05 |

  `SettingView = {key, description, valueType, unit, rules[], permittedLevels, installationDefault,
  businessValue | null, effectiveValue, effectiveSource, version}`.
* **Rules Enforced:**
  * **There is no single-setting read.** The client loads the list once and changes settings one by
    one; each change or reset returns the updated setting, which replaces its row
  * **Description** comes from the backend in the request language (`Accept-Language`); the front end
    keeps no per-setting `$localize` text. The key is shown as is and never translated
  * **Value kinds.** The front end knows value types, not keys:

    | `valueType` | Kind | Edited as | Shown as |
    |-------------|------|-----------|----------|
    | `MINUTES` | minutes | whole number + "min" | `<n> min` |
    | `MONEY` | money | number, 2 decimals, + `unit` (the business currency code) | `<n.nn> <unit>` |
    | `DATE_TIME_PATTERN`, `DATE_PATTERN`, `SINGLE_LINE_TEXT` | text | single-line text | the text |
    | anything else | unknown | not editable | the raw value as text |

  * **Values are typed JSON** (integer minutes, a number with up to 2 decimals, a string); the change
    request sends `value` as a string
  * **Rules are generic.** `rules` is a list of `{type, params}`; the UI describes and validates each
    entry by its `type`, never by the setting key: `range {min?, max?}`, `scale {maxScale}`,
    `length {minLength?, maxLength?}`, `single_line {}`, `pattern_parts {requiredParts[],
    forbiddenParts[]}`. An unknown rule type is shown as "Rule: <type>" and left to the server.
    `pattern_parts` is described but validated by the server only
  * **Server violations.** `400 settings.value.invalid` carries `params.violations[] = {code, rule}`;
    each violation is shown inline with a localized message per code (`type`, `whole_minutes`,
    `scale`, `range`, `length`, `single_line`, `pattern_malformed`, `pattern_unformattable`,
    `pattern_missing_part`, `pattern_time_of_day`); an unknown code is shown generically
  * **Optimistic concurrency.** `version` is sent back as `expectedVersion`; `409
    settings.version.conflict` means another administrator changed the setting — the client reloads
    the list and tells the user
  * **Level.** Only `BUSINESS` is offered. No setting permits `POINT` yet (`422
    settings.level.not_permitted`)
  * **Effective value** (`effectiveValue` + `effectiveSource`: `BUSINESS` or `INSTALLATION_DEFAULT`)
    is resolved by the backend and shown as delivered
  * **Error codes** `settings.key.not_editable`, `settings.level.not_permitted`,
    `settings.value.invalid`, `settings.version.conflict`, `validation.setting_scope_consistency` are
    registered with localized copy (en + ru)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** one request for the list; one request per change, reset or history page (+ one
  users call per history page)
* **Security/Compliance:** changes, resets and history are admin-only; the backend is the authority
  for permissions and validation
* **Usability/Other:** error handling follows the project's API error-handling rules; page chrome is
  localized in English and Russian

## 4. Acceptance Criteria (BDD)

**Scenario 1: A new setting of a known type needs no front-end change**

* **Given** the backend adds a `MINUTES` setting to the catalogue
* **When** an admin opens the business settings page
* **Then** it is listed with its description, key and value, and can be changed with the minutes
  input and its rules, without a front-end release

**Scenario 2: Rules come from the setting**

* **Given** a setting with `range {min: 1, max: 60}`
* **When** the backend changes `max` to 90
* **Then** the dialog describes "From 1 to 90" and accepts 90 without any front-end change

**Scenario 3: Unknown value type**

* **Given** the catalogue contains a setting of a `valueType` the front end does not know
* **When** the list loads
* **Then** the setting is shown with its raw value, its Change action is disabled, and every other
  setting works normally

## 5. Out of Scope

* Rental-point (`POINT`) values (FR-03, deferred)
* Operator-side use of settings (FR-04, deferred); applying settings in business flows
* Categories, search, localized setting labels, batch save (not in the backend contract)
* Editing the catalogue itself
* Test files (MVP rule)
