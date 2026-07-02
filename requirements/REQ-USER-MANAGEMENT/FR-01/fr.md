# User Story: FR-01 — User Domain Model, Mapper & Store

## 1. Description

**As a** developer
**I want to** have typed domain interfaces for a manageable user account, plus a mapper that
converts generated API shapes to/from those interfaces, plus a signal-based store that lists and
mutates user accounts
**So that** the Users management screens can read and write user data through clean domain types,
fully decoupled from auto-generated API shapes

## 2. Context & Business Rules

* **Trigger:** Any component or service in the Users management feature needs to read or write
  user-account data
* **Rules Enforced:**
  * A read domain type must expose: `id`, `username`, `email`, `displayName`, `status`
    (`'ACTIVE' | 'DISABLED'`), `mustChangePassword: boolean`, `roles` (`('ADMIN' | 'OPERATOR')[]`),
    `lastLoginAt` (`Date | undefined`)
  * A write domain type used for updates must expose only the three fields the backend accepts:
    `displayName?`, `roles?`, `status?` — mirroring the `PUT` contract exactly; it must never carry
    `username` or `email`
  * A separate write shape for creation must expose `username`, `email`, `displayName?`, `roles`
    (at least one required), and `password?` — mirroring the `POST` contract exactly
  * A domain result type must represent the one-time password reveal: the created/reset user
    record plus the plaintext `temporaryPassword` string; this type must never be cached or stored
    outside the single reveal flow that consumes it
  * The mapper is a pure static class — no Angular DI, no side effects — providing conversions from
    the generated response shape to the read domain type, and from both write domain types to
    their respective generated request shapes
  * A store must be introduced to load the full user list, expose it via a signal, and perform
    create, update, reset-password, and deactivate operations, refreshing its internal list after
    each successful mutation
  * `roles` must always contain at least one entry after any create or update the store performs;
    the store is not responsible for enforcing this (form-level validation in later FRs owns it),
    but its write types must not make an empty-roles state harder to prevent
  * Components must never import from `core/api/generated/` directly — only from the domain models
    and the store

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — pure data-mapping and a thin store wrapper; list size is capped at ~20
  records so no pagination or virtualization is needed
* **Security/Compliance:** The one-time temporary-password result must not be persisted to
  `localStorage`, logged, or retained in the store beyond the single reveal it supports — treat it
  as sensitive, transient data
* **Usability/Other:** All new domain types are exported from the `core/models/` barrel; the new
  store follows this repo's existing list-store naming convention (a dedicated list-oriented store
  name distinct from the single-entity store pattern used elsewhere) — **naming note for the
  architect:** this codebase already has `core/state/user.store.ts` exporting `UserStore` for the
  authenticated session's own profile; the new store introduced here must use a different,
  non-colliding name and file (see the convention `customer-list.store.ts` → `CustomerListStore`
  for precedent)

## 4. Acceptance Criteria (BDD)

**Scenario 1: fromResponse maps all fields correctly**

* **Given** a generated user-response shape with all fields populated, including
  `roles: ['ADMIN', 'OPERATOR']` and a non-null `lastLoginAt`
* **When** the mapper converts it to the read domain type
* **Then** the returned object exposes `id`, `username`, `email`, `displayName`, `status`,
  `mustChangePassword`, `roles`, and `lastLoginAt` all mapped 1-to-1, with `lastLoginAt` as a `Date`

**Scenario 1a: fromResponse handles a null last login**

* **Given** a generated user-response shape where `lastLoginAt` is `null`
* **When** the mapper converts it to the read domain type
* **Then** the returned object's `lastLoginAt` is `undefined`

**Scenario 2: update-write mapping matches the PUT contract exactly**

* **Given** an update write object with `displayName: 'Jane Doe'`, `roles: ['OPERATOR']`,
  `status: 'ACTIVE'`
* **When** the mapper converts it to the update request shape
* **Then** the returned request contains exactly `displayName`, `roles`, `status` — no `username`
  or `email` keys are present

**Scenario 3: create-write mapping matches the POST contract exactly**

* **Given** a create write object with `username: 'jsmith'`, `email: 'j@example.com'`,
  `roles: ['ADMIN']`, and no `password`
* **When** the mapper converts it to the create request shape
* **Then** the returned request contains `username`, `email`, `roles`, and omits `password`

**Scenario 4: store loads the user list**

* **Given** the backend returns an array of user records
* **When** the store's load operation is invoked
* **Then** the store's user-list signal reflects the mapped domain objects and its loading signal
  returns to `false`

**Scenario 5: store refreshes after a mutation**

* **Given** the store has already loaded its user list
* **When** a create, update, reset-password, or deactivate operation completes successfully
* **Then** the store's user-list signal reflects the updated/added record without requiring the
  caller to manually trigger a reload

**Scenario 6: one-time password result is not retained**

* **Given** a create or reset-password operation returns a temporary password
* **When** the operation completes and the caller has read the result once
* **Then** the store itself holds no persistent signal or field containing that plaintext password
  after the call resolves

## 5. Out of Scope

* Any UI component, dialog, or route (covered by FR-02 through FR-07)
* Enforcing the "at least one role" rule in a form (covered by FR-03/FR-04)
* Self-lockout logic (covered by FR-02)
* Deciding the exact final class/file names — that is an architect-level decision; this FR only
  flags the naming collision risk
