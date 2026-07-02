# System Design: FR-01 - User Domain Model, Mapper & Store

## 1. Architectural Overview

This story lays the foundation for the entire User Management feature inside the Shared Library.
It introduces three new artifacts in the existing three-layer data pipeline
(`core/api/generated/` -> `core/mappers/` -> `core/models/`): a domain model module describing a
manageable user account and its write shapes, a pure static mapper that converts between the
generated `UsersService` API shapes and these domain types, and a signal-based store that loads the
full user list and performs create/update/reset-password/deactivate mutations. No UI components or
routes are introduced here — all downstream stories (FR-02 through FR-06) consume this store and
these types exclusively, and never import from `core/api/generated/` directly.

This story also introduces a single canonical source for the two assignable roles (`ADMIN`,
`OPERATOR`), consumed by this story's own domain types and, in later stories, by the role-selection
UI in the create and edit dialogs (FR-03, FR-04). This directly addresses a duplication risk: the
literal union `'ADMIN' | 'OPERATOR'` currently appears independently in the generated API models
(expected, since that is the OpenAPI contract source), in `user.store.ts`, in
`user-profile.model.ts`, and in `auth.service.ts`'s `isAdmin`/`isOperator` computed signals — with no
shared constant tying them together for anything other than the type literal itself.

## 2. Impacted Components

* **`managed-user.model.ts` (Shared Library — Domain Models, new file):** Exports the read domain
  type `ManagedUser`, the two write domain types `ManagedUserCreateWrite` and
  `ManagedUserUpdateWrite`, and the one-time-reveal result type `UserCreationResult`.
* **`role.model.ts` (Shared Library — Domain Models, new file):** Exports the canonical `Role` type,
  the `ASSIGNABLE_ROLES` const array (`['ADMIN', 'OPERATOR']`, exactly these two, in this order), and
  a `ROLE_LABELS` record mapping each `Role` to its `$localize`d display label. This is the single
  source of truth for "what roles exist" and "what is this role called in the UI" — every place that
  needs to enumerate or check roles (role checkboxes in FR-03/FR-04, and this FR's own domain types)
  imports from here instead of redeclaring the literal union.
* **`managed-user.mapper.ts` (Shared Library — Mappers, new file):** Exports `ManagedUserMapper` as
  a pure static class with `fromResponse(r: UserResponse): ManagedUser`,
  `toCreateRequest(w: ManagedUserCreateWrite): CreateUserRequest`,
  `toUpdateRequest(w: ManagedUserUpdateWrite): UpdateUserRequest`, and
  `fromCreationResponse(r: UserCreationResponse): UserCreationResult`.
* **`managed-user.store.ts` (Shared Library — State, new file):** Exports `ManagedUserStore`, a
  `providedIn: 'root'` signal-based store exposing the full user list, loading/saving signals, and
  mutation methods (`load`, `create`, `update`, `resetPassword`, `deactivate`).
* **`core/models/index.ts` (Shared Library — Models Barrel):** Re-exports `ManagedUser`,
  `ManagedUserCreateWrite`, `ManagedUserUpdateWrite`, `UserCreationResult`, `Role`,
  `ASSIGNABLE_ROLES`, `ROLE_LABELS`.
* **`core/state/index.ts` / equivalent state barrel (Shared Library):** Re-exports
  `ManagedUserStore` alongside the existing stores.

## 3. Abstract Data Schema Changes

* **Entity: `Role` (type, not a persisted entity)**
  * A string literal union with exactly two members: `'ADMIN'`, `'OPERATOR'`. No hierarchy is
    implied between members — each is an independent capability grant (see Non-Functional section).
  * `ASSIGNABLE_ROLES: readonly Role[]` — the ordered, exhaustive list of roles assignable through
    the UI: `['ADMIN', 'OPERATOR']`.
  * `ROLE_LABELS: Record<Role, string>` — `$localize`d display label per role, consumed by role
    chips (FR-02) and role checkboxes (FR-03/FR-04).

* **Entity: `ManagedUser`** (read model)
  * **Attributes:** `id` (string, UUID), `username` (string), `email` (string), `displayName`
    (string, empty string when absent — never `undefined`, so table cells never render `undefined`),
    `status` (`'ACTIVE' | 'DISABLED'`), `mustChangePassword` (boolean), `roles` (`Role[]`, always at
    least one entry once past the mapper), `lastLoginAt` (`Date | undefined` — `undefined` when the
    API returns `null`).

* **Entity: `ManagedUserCreateWrite`** (write model — mirrors `POST` contract exactly)
  * **Attributes:** `username` (string, required), `email` (string, required), `displayName`
    (string, optional), `roles` (`Role[]`, required, at least one), `password` (string, optional —
    omitted means "let the backend generate one").

* **Entity: `ManagedUserUpdateWrite`** (write model — mirrors `PUT` contract exactly)
  * **Attributes:** `displayName` (string, optional), `roles` (`Role[]`, optional), `status`
    (`'ACTIVE' | 'DISABLED'`, optional). Deliberately has no `username` or `email` fields — the type
    itself makes it structurally impossible to accidentally send those immutable fields.

* **Entity: `UserCreationResult`** (transient result — never persisted)
  * **Attributes:** `user` (`ManagedUser`), `temporaryPassword` (string). Produced only by
    `create()` (when no password was supplied) and `resetPassword()`; consumed exactly once by the
    reveal flow (FR-07) and never retained by the store afterward.

* **Relations:** `ManagedUser.roles` is a plain array of the canonical `Role` type — no relational
  join table at this layer; role membership is just an array field on the user resource as returned
  by the backend.

## 4. Component Contracts & Payloads

* **Interaction: `ManagedUserMapper.fromResponse` — `UserResponse` (inbound)**
  * **Protocol:** In-process function call
  * **Payload Changes:** `displayName` defaults to `''` when absent; `lastLoginAt` converted from
    ISO string (or absent) to `Date | undefined`; `roles` passed through as-is (already typed as
    `Role[]`-compatible by the generated union); all other fields passed through 1-to-1.

* **Interaction: `ManagedUserMapper.toCreateRequest` — `CreateUserRequest` (outbound)**
  * **Protocol:** In-process function call
  * **Payload Changes:** `username`, `email`, `roles` are required and always present;
    `displayName` and `password` sent as `undefined` when absent so the generated client omits them.

* **Interaction: `ManagedUserMapper.toUpdateRequest` — `UpdateUserRequest` (outbound)**
  * **Protocol:** In-process function call
  * **Payload Changes:** Only `displayName`, `roles`, `status` are ever present on the resulting
    object — no `username`/`email` keys exist on `ManagedUserUpdateWrite` so there is nothing to
    accidentally leak into the request.

* **Interaction: `ManagedUserMapper.fromCreationResponse` — `UserCreationResponse` (inbound)**
  * **Protocol:** In-process function call
  * **Payload Changes:** Wraps `ManagedUserMapper.fromResponse(r.user)` plus `r.temporaryPassword`
    into a `UserCreationResult`; this is the only path by which a plaintext password enters domain
    space, and it is never written into any store signal.

* **Interaction: `ManagedUserStore` -> `UsersService` (generated)**
  * **Protocol:** HTTP (via generated Angular service, `/api/auth/users*`)
  * **Payload Changes:** `load()` calls `list()`; `create(write)` calls `create(toCreateRequest(write))`
    and returns `UserCreationResult` to the caller without storing the plaintext password field
    anywhere on the store; `update(id, write)` calls `update(id, toUpdateRequest(write))`;
    `resetPassword(id)` calls `resetPassword(id)` and likewise returns `UserCreationResult` without
    retention; `deactivate(id)` calls `deactivate(id)`.

## 5. Updated Interaction Sequence

1. `ManagedUserStore.load()` sets its internal loading signal, calls `UsersService.list()`, maps
   each `UserResponse` through `ManagedUserMapper.fromResponse`, and sets the internal user-list
   signal; loading signal returns to `false` in a `finalize`.
2. `ManagedUserStore.create(write: ManagedUserCreateWrite)` calls
   `UsersService.create(ManagedUserMapper.toCreateRequest(write))`; on success it maps the response
   via `ManagedUserMapper.fromCreationResponse`, appends the new `ManagedUser` to the internal list
   signal (so FR-02's list reflects it without a manual reload), and returns the full
   `UserCreationResult` (including the plaintext password) to the caller as the `Observable`'s
   emitted value — the store retains only the `ManagedUser` portion in its list signal, never the
   password.
3. `ManagedUserStore.update(id, write: ManagedUserUpdateWrite)` calls
   `UsersService.update(id, ManagedUserMapper.toUpdateRequest(write))`; on success it replaces the
   matching entry in the internal list signal by `id`.
4. `ManagedUserStore.resetPassword(id)` calls `UsersService.resetPassword(id)`; on success it updates
   the matching user's `mustChangePassword` flag to `true` in the internal list signal (status/roles
   are unaffected) and returns the full `UserCreationResult` to the caller, again without retaining
   the password.
5. `ManagedUserStore.deactivate(id)` calls `UsersService.deactivate(id)`; on success it replaces the
   matching entry in the internal list signal with the returned `ManagedUser` (now `status:
   'DISABLED'`).
6. On any HTTP failure in steps 2-5, the store does not mutate its list signal and re-throws/
   propagates the error to the caller (the calling component/dialog is responsible for surfacing it
   via the standard error-handling toolkit — out of scope for this FR).

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** `UserCreationResult` (and the plaintext `temporaryPassword` it carries) is
  never assigned to a store signal, never logged, and never written to `localStorage`/
  `sessionStorage` — it exists only as the resolved value of the `create`/`resetPassword` Observable,
  consumed once by the calling dialog flow (FR-03/FR-06/FR-07). This is a hard constraint carried
  through every later FR that touches this result type.
* **Roles are independent, not hierarchical (design constraint):** `Role` is a flat two-member union
  with no ordering or subsumption semantics. Nothing in this domain layer treats `roles.length > 0`
  as equivalent to holding a specific role, and nothing treats holding `ADMIN` as implying
  `OPERATOR` capabilities or vice versa — each entry in `ManagedUser.roles` /
  `ManagedUserCreateWrite.roles` / `ManagedUserUpdateWrite.roles` grants only its own named
  capability. This mirrors the existing independent-check pattern in `auth.service.ts`
  (`roles.includes('ADMIN')` / `roles.includes('OPERATOR')` as separate, unrelated predicates) and
  must not be short-circuited by any future convenience helper that collapses roles into a single
  "is privileged" boolean.
* **Follow-up (optional, not required by this REQ):** `auth.service.ts` (`isAdmin`/`isOperator`
  computed signals) and `admin.guard.ts` currently re-derive role checks against inline
  `'ADMIN'`/`'OPERATOR'` string literals rather than the new canonical `Role` type introduced here.
  Migrating them to reference `Role`/`ASSIGNABLE_ROLES` would remove the last duplicated literals in
  the codebase, but those files sit outside this REQ's directly-touched surface (auth is a separate,
  already-shipped concern) — recommended as a low-risk follow-up cleanup, not a blocking task here.
* **Scale & Performance:** List size is capped at ~20 records by design — no pagination,
  virtualization, or caching is introduced. `load()` is a full replace of the list signal on every
  call; mutation methods patch the in-memory list directly instead of triggering a full reload,
  keeping the UI responsive without extra round-trips.
