# User Story: FR-04 — Operator App Loads Effective Settings for Its Working Point

> **Status: Deferred (2026-11-06).** Applying settings in the operator app is a later task. The delivered backend exposes no effective-settings-per-point read; operators read the same `GET /api/business-settings` list, and every setting change takes effect server-side for each following operation, so nothing needs refreshing on the operator side today (`JenkaBY/bike-rental` docs, "Business settings").

> **Depends on:** FR-01 (effective-settings contract, type registry). Independent of FR-02 / FR-03.
> Blocked until the backend effective-settings endpoint is published.

## 1. Description

**As an** operator (and as the operator-app features that implement business rules)
**I want** the operator app to quietly load the effective business settings of my working point
and keep them available to the app
**So that** rules such as currency display, rental quota or grace period follow what the admin
configured for my point, without me seeing or managing any settings

## 2. Context & Business Rules

* **Trigger:**
  * The operator is logged in and has a usable working point (app start / after login)
  * The operator switches the working point in the toolbar point switcher
  * A consumer explicitly asks for a refresh (e.g. a future screen that needs fresh values)
* **Rules Enforced:**
  * The app reads the **effective** settings for the working point (FR-01). It never reads the
    catalog, network values or other points' values, and never combines them itself
  * The settings are held in **one app-wide store** shared by every operator screen, so they are
    loaded once per trigger, not per screen
  * **Nothing is displayed.** There is no settings screen, menu item, badge or message about
    settings in the operator app as part of this story
  * **Typed access for consumers:** consumers ask the store for the value of a key as a specific
    type (e.g. "the value of `<key>` as a DURATION") and receive either a typed value or "not
    available". The store itself contains no list of specific keys; keys are supplied by the
    consuming feature
  * **"Not available"** is returned when settings have not loaded yet, failed to load, the key is
    not present, or the value's type differs from the requested type. A type mismatch is logged
    once per key as a WARN (key and types only). Each consumer decides its own behaviour when a
    value is not available
  * Consumers can also see the store's load state (not loaded / loading / loaded / failed), so a
    feature can wait for settings when it must
  * **No working point:** when the operator has no usable working point, no request is sent and
    the store stays empty ("not available" for every key)
  * **Working-point switch:** settings of the previous point are cleared immediately (never served
    for the new point) and the new point's settings are loaded
  * **Logout:** settings are cleared
  * **Load failure:** the operator is not interrupted: no error message, no blocked screen. The
    failure is logged as a WARN (no values), the store is marked as failed, and the next trigger
    (point switch, explicit refresh, next app start) tries again
  * **Loading never blocks app start-up:** the operator can use the app while settings load
  * **Freshness:** values may be up to one working session old; an admin change reaches an
    operator on the next trigger (app start, point switch, explicit refresh). No polling or push in
    this story
  * The values are kept in memory only (not stored on the device) in this story (decided, Q8)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** One request per trigger; app start-up and the first screen must not wait for
  it
* **Security/Compliance:** The request is made for the operator's own working point the same way
  every other operator business request names its point; the operator cannot read other points'
  settings. Logs never contain setting values or personal data
* **Usability/Other:**
  * No user-visible text is introduced by this story, so no translations are needed
  * Failures are silent to the operator (no toast); they must still follow the project's API
    error-handling rules for parsing and must not be toasted by the global error handler
  * The same store must be usable by the admin app later without changes to its behaviour (not
    wired into admin in this story)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Settings load after login**

* **Given** an operator logs in with working point `center`
* **When** the operator app starts
* **Then** one request for the effective settings of `center` is sent in the background, the first
  screen is usable without waiting for it, and once it completes the store's state is "loaded"

**Scenario 2: Typed access**

* **Given** the effective settings of `center` contain a DURATION key with value 30
* **When** a consumer asks for that key as a DURATION
* **Then** it receives 30; asking for the same key as a BOOLEAN returns "not available" and logs a
  single WARN with the key

**Scenario 3: Unknown key**

* **Given** the settings are loaded
* **When** a consumer asks for a key that the backend did not return
* **Then** it receives "not available" and nothing is shown to the operator

**Scenario 4: Working-point switch**

* **Given** settings for `center` are loaded
* **When** the operator switches the working point to `lake`
* **Then** the `center` settings are cleared at once, consumers get "not available" until the
  `lake` settings arrive, and then they get the `lake` values

**Scenario 5: No working point**

* **Given** the operator has no working point assigned
* **When** the app starts
* **Then** no settings request is sent and every key is "not available"

**Scenario 6: Load failure is silent**

* **Given** the effective-settings request fails
* **When** the app starts
* **Then** no error notification or blocking message is shown, a WARN is logged, the store state is
  "failed", and an explicit refresh or the next point switch tries again

**Scenario 7: Nothing displayed**

* **Given** settings are loaded
* **When** the operator uses any screen
* **Then** no setting, settings page or settings menu item is visible in the operator app

**Scenario 8: Logout clears settings**

* **Given** settings are loaded
* **When** the operator logs out
* **Then** the store is cleared and its state is "not loaded"

## 5. Out of Scope

* Changing any existing operator feature (currency display, quota, grace, rental duration, shift
  auto-close, …) to read from this store; each consumer is adopted in its own later story
* Displaying settings in the operator app
* Live updates (polling, push) when an admin changes a setting
* Offline storage of settings on the device
* Loading settings in the admin app
* Test files (MVP rule)

## 6. Open Questions

* **Q7 — open, waiting for the backend contract:** the product owner leans towards app start /
  login, working-point switch and explicit refresh as triggers, but the final choice waits for the
  backend design (settings may arrive together with other start-up data in one response). Do not
  start design of the load triggers until the backend contract is known
* **Q8 — decided:** memory only, nothing stored on the device
* **Q9 — decided:** no automatic retry; a failed load is logged as a WARN and the next trigger
  tries again
