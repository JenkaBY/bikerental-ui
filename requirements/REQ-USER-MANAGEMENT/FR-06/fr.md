# User Story: FR-06 — Reset Password Flow

## 1. Description

**As an** admin user
**I want to** trigger a password reset for another user, with a confirmation step, and be shown the
resulting one-time temporary password
**So that** I can help a staff member regain access (e.g. after a forgotten password) while
ensuring their old credentials and sessions are invalidated

## 2. Context & Business Rules

* **Trigger:** Admin clicks the reset-password action on a user row in `/admin/users` (FR-02); per
  FR-02's self-lockout gating, this action is never reachable for the admin's own row
* **Rules Enforced:**
  * Clicking the action opens a confirmation dialog warning that a new temporary password will be
    issued, the user will be forced to change it at next login, and their existing sessions will
    be revoked
  * Only on explicit confirmation does the app call the reset-password endpoint (no request body)
  * On success: the response's one-time temporary password is handed off to the temporary-password
    reveal (FR-07)
  * On HTTP error: the error is surfaced via the standard error-handling toolkit; no reveal is shown
  * Declining the confirmation performs no API call
  * The users list (FR-02) does not need to change its visible columns as a result of this action
    (status/roles are unaffected by a password reset), but `mustChangePassword` is now true for
    that user on the backend

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single API call on confirmation; the action control shows a busy state while
  the request is in flight to prevent duplicate resets
* **Security/Compliance:** The confirmation copy must clearly state that existing sessions will be
  revoked and a new credential issued; the returned temporary password must never be logged or
  persisted outside the one-time reveal flow
* **Usability/Other:** N/A beyond the above

## 4. Acceptance Criteria (BDD)

**Scenario 1: Reset-password requires confirmation**

* **Given** the admin clicks the reset-password action on a user row
* **When** the confirmation dialog appears
* **Then** it clearly states that a new temporary password will be issued, the user must change it
  at next login, and existing sessions will be revoked — and no API call is made yet

**Scenario 2: Confirmed reset opens the one-time reveal**

* **Given** the reset-password confirmation dialog is open
* **When** the admin confirms
* **Then** the reset-password endpoint is called, and on success the temporary-password reveal
  (FR-07) opens showing the new plaintext password

**Scenario 3: Declined reset makes no change**

* **Given** the reset-password confirmation dialog is open
* **When** the admin dismisses or cancels it
* **Then** no API call is made and no reveal dialog appears

**Scenario 4: Reset failure surfaces an error**

* **Given** the admin confirms the reset
* **When** the API call fails
* **Then** an error notification is shown via the standard error-handling toolkit and no reveal
  dialog appears

## 5. Out of Scope

* Reaching this action for the acting admin's own account (prevented by FR-02's self-lockout
  gating; this FR assumes the action is only ever invoked on another user's row)
* The temporary-password reveal dialog's own display/copy behavior (covered by FR-07)
* Self-service "change my own password" flows (out of scope — this is admin-triggered reset of
  another user's credentials)
* Any test-file changes (MVP rule — no tests during this phase)
