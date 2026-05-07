# System Design: FR-01 — UserProfile Domain Model & Mapper

## 1. Architectural Overview

This story introduces two new artefacts into the established three-layer data pipeline of the `shared` library: the `UserProfile` domain interface (in `core/models/`) and the `UserProfileMapper` static class (in `core/mappers/`). No new components, services, or backend interactions are introduced.

The design follows the exact same pattern already proven by `CustomerMapper`, `TariffMapper`, and others: a raw auth-response shape (consumed from the generated API client) is converted by the mapper into a stable domain object that components and stores import exclusively from `core/models/`. The `isAdmin` and `isOperator` convenience flags are computed once inside the mapper and embedded directly on the model, so downstream consumers never re-derive role logic from the raw `roles` array.

## 2. Impacted Components

* **`shared/core/models/` (Domain Model Layer):**
  Must receive a new `user-profile.model.ts` file declaring the `UserProfile` interface with raw fields (`id`, `email`, `firstName`, `lastName`, `roles: string[]`) and mapper-derived boolean flags (`isAdmin`, `isOperator`). The interface must be re-exported from the layer's `index.ts` barrel and from `public-api.ts`.

* **`shared/core/mappers/` (Mapper Layer):**
  Must receive a new `user-profile.mapper.ts` file declaring the `UserProfileMapper` pure static class. Its sole method `fromResponse(response)` maps raw auth response fields to `UserProfile` and derives `isAdmin` and `isOperator` by checking whether the `roles` array contains the respective string literals. The mapper must be re-exported from `mappers/index.ts` and from `public-api.ts`.

* **`shared/public-api.ts` (Library Barrel):**
  Must export both `UserProfile` and `UserProfileMapper` so that `admin` and `operator` SPAs can import them without referencing internal library paths.

## 3. Abstract Data Schema Changes

* **Entity: `UserProfile`**
  * **Attributes Added:**
    * `id: string` — opaque identifier from the auth token or user record
    * `email: string` — primary contact address
    * `firstName: string` — given name
    * `lastName: string` — family name
    * `roles: string[]` — raw role-slug array from the auth response; unconstrained string array to support future expansion
    * `isAdmin: boolean` — derived flag; `true` when `roles` includes `'ADMIN'`
    * `isOperator: boolean` — derived flag; `true` when `roles` includes `'OPERATOR'`
  * **Relations:** None — `UserProfile` is a standalone read-only domain object; it is stored as a value inside `UserStore` (FR-03), not persisted to any data store

## 4. Component Contracts & Payloads

* **Interaction: `Auth Response Shape` → `UserProfileMapper` → `UserProfile`**
  * **Protocol:** In-process function call (pure static method, no network I/O)
  * **Input payload:** Raw auth response object containing at minimum `id: string`, `email: string`, `firstName: string`, `lastName: string`, `roles: string[]`
  * **Output payload:** `UserProfile` with all raw fields copied 1-to-1 plus `isAdmin` and `isOperator` derived booleans
  * **Error path:** If the input `roles` field is absent or empty, both flags default to `false`; no exception is thrown

* **Interaction: `UserProfileMapper` → `UserStore` (FR-03)**
  * **Protocol:** In-process — the auth layer calls `UserProfileMapper.fromResponse(response)` and passes the result to `UserStore.setUser(profile)`
  * **Payload:** `UserProfile` domain object

## 5. Updated Interaction Sequence

**Happy path — successful login:**

1. Auth layer receives a successful login response from the backend (shape: raw response with `roles` array).
2. Auth layer calls `UserProfileMapper.fromResponse(response)`.
3. `UserProfileMapper` maps all scalar fields 1-to-1 and computes `isAdmin = roles.includes('ADMIN')` and `isOperator = roles.includes('OPERATOR')`.
4. `UserProfileMapper.fromResponse` returns a fully typed `UserProfile`.
5. Auth layer calls `UserStore.setUser(profile)` with the mapped domain object (FR-03).
6. Any component reading `UserStore.currentUser()` or `UserStore.isAuthenticated()` reactively receives the updated value.

**Unhappy path — empty roles array:**

1. Auth layer receives a response with `roles: []`.
2. `UserProfileMapper.fromResponse` maps the response; both `isAdmin` and `isOperator` resolve to `false`.
3. A fully valid `UserProfile` is returned; no error is thrown.
4. Components relying on `isAdmin` or `isOperator` reactively see `false` and hide or disable restricted UI elements.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:**
  `UserProfile` contains no credential material (no token, no password hash). The raw auth response shape is consumed exclusively inside `UserProfileMapper`; no raw response object escapes into components or stores. `isAdmin` and `isOperator` are derived server-authoritative values (based on the roles issued by the backend) and are never settable directly by the client.

* **Scale & Performance:**
  The mapping operation is O(n) where n is the number of roles (typically 1–2); no caching or lazy evaluation is required. Because `UserProfile` is stored as a signal value in `UserStore`, Angular's reactivity graph propagates changes to all dependent `computed()` signals in a single synchronous pass without additional network round-trips.
