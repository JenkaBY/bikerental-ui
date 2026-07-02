# User Story: FR-05 — Activate / Deactivate Flow

## 1. Description

**As an** admin user
**I want to** deactivate a user account (with a confirmation step) or reactivate a previously
disabled one (no confirmation needed)
**So that** I can revoke a departing or misbehaving staff member's access, or restore access when
appropriate, without a separate deletion step since accounts are never deleted

## 2. Context & Business Rules

* **Trigger:** Admin clicks the activate/deactivate toggle action on a user row in `/admin/users`
  (FR-02); per FR-02's self-lockout gating, this action is never reachable for the admin's own row
* **Rules Enforced:**
  * The toggle is a single control per row whose icon and behavior depend on the row's current
    status
  * **Deactivating** (row is currently `ACTIVE`): clicking the toggle opens a confirmation dialog
    warning that the account will be disabled and its active sessions revoked; only on explicit
    confirmation does the app call the dedicated deactivate endpoint
  * **Activating** (row is currently `DISABLED`): clicking the toggle immediately calls the generic
    update with `{ status: 'ACTIVE' }` — no confirmation dialog is shown
  * On success (either direction): the users list (FR-02) refreshes and the row's status
    badge/toggle icon updates accordingly
  * On HTTP error (either direction): the error is surfaced via the standard error-handling toolkit
    (e.g. a notification), and the row's state is left unchanged pending retry
  * Declining the deactivate confirmation performs no API call and leaves the row unchanged

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single API call per action; the toggle control shows a busy state while its
  request is in flight to prevent duplicate clicks
* **Security/Compliance:** The deactivate confirmation copy must clearly communicate that the
  user's active sessions will be revoked, since this is a consequential, hard-to-reverse-in-the-
  moment action from the affected user's perspective
* **Usability/Other:** The toggle's enabled/disabled visual state must make the next action
  unambiguous (i.e. an `ACTIVE` row's control is clearly labeled/iconed as "deactivate", and vice
  versa)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Deactivating an active user requires confirmation**

* **Given** a user row has `status: 'ACTIVE'`
* **When** the admin clicks the toggle action
* **Then** a confirmation dialog appears warning that the account will be disabled and its sessions
  revoked, and no API call is made yet

**Scenario 2: Confirmed deactivation disables the account**

* **Given** the deactivate confirmation dialog is open
* **When** the admin confirms
* **Then** the deactivate endpoint is called, and on success the row's status updates to
  `DISABLED` and the toggle icon flips to the "activate" state

**Scenario 3: Declined deactivation makes no change**

* **Given** the deactivate confirmation dialog is open
* **When** the admin dismisses or cancels it
* **Then** no API call is made and the row's status remains `ACTIVE`

**Scenario 4: Activating a disabled user requires no confirmation**

* **Given** a user row has `status: 'DISABLED'`
* **When** the admin clicks the toggle action
* **Then** the update call with `{ status: 'ACTIVE' }` is made immediately with no confirmation
  step, and on success the row's status updates to `ACTIVE`

**Scenario 5: Deactivation failure leaves the row unchanged**

* **Given** the admin confirms deactivation
* **When** the API call fails
* **Then** an error notification is shown via the standard error-handling toolkit and the row's
  status remains `ACTIVE`

**Scenario 6: Activation failure leaves the row unchanged**

* **Given** the admin clicks activate on a disabled row
* **When** the API call fails
* **Then** an error notification is shown via the standard error-handling toolkit and the row's
  status remains `DISABLED`

## 5. Out of Scope

* Reaching this action for the acting admin's own account (prevented by FR-02's self-lockout
  gating; this FR assumes the toggle is only ever invoked on another user's row)
* Changing status via the Edit dialog's status field (covered by FR-04; this FR is the primary
  activate/deactivate UX)
* Account deletion (accounts are never deleted, only deactivated — out of scope for the entire
  feature)
* Any test-file changes (MVP rule — no tests during this phase)
