# User Story: FR-04 — Edit User Dialog

## 1. Description

**As an** admin user
**I want to** edit another user's display name, roles, and status from the Users list screen
**So that** I can keep staff records accurate and adjust access as responsibilities change

## 2. Context & Business Rules

* **Trigger:** Admin clicks the edit action on a user row in `/admin/users` (FR-02); per FR-02's
  self-lockout gating, this action is never reachable for the admin's own row
* **Rules Enforced:**
  * Dialog fields:
    - **Username** (read-only, display only): shown for context, cannot be changed
    - **Email** (read-only, display only): shown for context, cannot be changed
    - **Display name** (editable, optional): text input
    - **Roles** (editable, required, at least one): checkboxes/multi-select for `ADMIN` and
      `OPERATOR`
    - **Status** (editable): `ACTIVE` / `DISABLED` selector
  * The dialog pre-fills all fields with the selected user's current values
  * Save button is disabled if roles would end up empty (client-side guard; the backend would
    silently ignore an empty roles array rather than reject it, but the UI never allows submitting
    that state)
  * On Save: submits only the update request fields (`displayName`, `roles`, `status`) — username
    and email are never sent since the backend does not accept them
  * On success: the dialog closes and the users list (FR-02) refreshes
  * On HTTP error: the error is surfaced inside the dialog via the standard error-handling toolkit;
    the dialog remains open
  * Cancel always closes the dialog with no side effects and no API call
  * No confirm dialog is required before saving an edit

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single API call on save; a loading indicator is shown on the Save button while
  the request is in flight
* **Security/Compliance:** N/A beyond the standard error-handling toolkit for surfacing failures
* **Usability/Other:** Read-only username/email fields must be visually distinguishable from the
  editable fields (e.g. disabled styling) so the admin does not mistake them for editable

## 4. Acceptance Criteria (BDD)

**Scenario 1: Dialog opens pre-filled with current values**

* **Given** the admin clicks edit on a user row
* **When** the dialog opens
* **Then** display name, roles, and status reflect that user's current values, and username/email
  are shown read-only with the correct values

**Scenario 2: Save blocked if roles would become empty**

* **Given** the edit dialog is open
* **When** the admin deselects all roles
* **Then** the Save button becomes disabled until at least one role is reselected

**Scenario 3: Successful save refreshes the list**

* **Given** the admin changes display name, roles, and/or status to valid values
* **When** the admin clicks Save and the API succeeds
* **Then** the dialog closes and the users list reflects the updated values

**Scenario 4: Username and email cannot be edited**

* **Given** the edit dialog is open
* **When** the admin attempts to interact with the username or email fields
* **Then** those fields are disabled/read-only and reject input

**Scenario 5: API error keeps dialog open**

* **Given** the admin submits a valid change
* **When** the API responds with an error
* **Then** an inline error is shown, the dialog remains open, and the Save button is re-enabled for
  retry

**Scenario 6: Cancel closes the dialog with no side effects**

* **Given** the edit dialog is open with unsaved changes
* **When** the admin clicks Cancel
* **Then** the dialog closes, no API call is made, and the users list is unchanged

## 5. Out of Scope

* Reaching this dialog for the acting admin's own account (prevented by FR-02's self-lockout
  gating; this FR assumes the dialog is only ever opened for another user)
* Password reset (covered by FR-06)
* Activate/deactivate as a standalone action outside this dialog's status field (covered by FR-05;
  this dialog's status field is an alternate path to the same backend call but is not the primary
  activate/deactivate UX)
* Any test-file changes (MVP rule — no tests during this phase)
