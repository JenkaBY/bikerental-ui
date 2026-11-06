# User Story: FR-05 — Business Settings Change History

> **Depends on:** FR-01, FR-02. Backend: `JenkaBY/bike-rental` #334 (append-only history) and the
> `ids` filter of `GET /api/auth/users`. Implemented for `JenkaBY/bikerental-ui#171`.

## 1. Description

**As an** admin user
**I want to** see who changed which business setting, when, and from what to what
**So that** I can trace and explain changes in how the network operates

## 2. Context & Business Rules

* **Trigger:** the "Change history" tab of Business settings (`/business-settings/history`), or the
  "Show change history" action of a setting row (opens the tab with `?settingKey=<key>`)
* **Rules Enforced:**
  * Entries are listed **newest first** (fixed by the backend), paged (20 by default; 10, 20, 50 or
    100 per page — the backend allows at most 100)
  * **Filters:** setting (all settings, or one setting from the catalogue) and an optional period
    picked as days *from* / *to*; the period is sent as the half-open instant range
    `[from 00:00, (to + 1 day) 00:00)` in local time. Changing a filter returns to the first page.
    Filters and page live in the URL query (`settingKey`, `from`, `to`, `page`, `size`)
  * **Columns:** changed at; setting (description + key); change ("New value" or "Reset to default",
    with previous → new value formatted per kind, FR-01); changed by
  * **Authors:** the distinct `changedBy` ids of the page are resolved with **one**
    `GET /api/auth/users?ids=` call; an id the backend does not return — or a failed call — is shown
    as the id itself
  * A setting that left the catalogue is shown with its key as description and its raw values
  * Empty result: "No changes found for the selected filters."; load failure: an error with "Retry"

## 3. Non-Functional Requirements (NFRs)

* **Performance:** one history request and at most one users request per page
* **Security/Compliance:** admin-only (an operator gets `403`)
* **Usability/Other:** all chrome localized (en + ru)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Newest first with author names**

* **Given** two changes by two administrators
* **When** the admin opens Change history
* **Then** the newer change is first and both rows show the administrators' names, resolved with one
  users call

**Scenario 2: Filter by setting and period**

* **When** the admin picks one setting and a from/to period
* **Then** only that setting's changes inside the period are listed, starting from page 1

**Scenario 3: Deleted author**

* **Given** a change made by a user that no longer exists
* **When** the page loads
* **Then** the row shows that user's id as the author

## 5. Out of Scope

* Editing or deleting history entries (the history is append-only)
* Rental-point level entries beyond showing what the backend returns
* Test files (MVP rule)
