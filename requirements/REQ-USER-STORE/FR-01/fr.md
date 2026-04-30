# User Story: FR-01 — UserProfile Domain Model & Mapper

## 1. Description

**As a** developer
**I want to** have a typed `UserProfile` domain interface and a `UserProfileMapper` in the shared library
**So that** the `UserStore` and any component that displays user identity data or checks role-based access can import a single, stable, backend-agnostic type with pre-computed UI flags

## 2. Context & Business Rules

* **Trigger:** Any component, service, or store needs to reference the currently authenticated user's identity data or evaluate whether the user holds a specific role
* **Rules Enforced:**
  * `UserProfile` is a **placeholder** interface; its shape will be refined once the real `/api/auth/login` response contract is finalised
  * Raw data fields: `id: string`, `email: string`, `firstName: string`, `lastName: string`, `roles: string[]`
  * `roles` is `string[]` (not a fixed union type) to support future multi-role expansion without a model breaking-change
  * **UI convenience flags** (derived, read-only booleans computed by the mapper — never set manually):
    * `isAdmin: boolean` — `true` when `roles` contains `'ADMIN'`
    * `isOperator: boolean` — `true` when `roles` contains `'OPERATOR'`
  * A `UserProfileMapper` pure static class must be provided with a single method `fromResponse(response)` that accepts the raw auth response shape and returns a fully populated `UserProfile`, including the `isAdmin` and `isOperator` flags
  * `UserProfileMapper` must not use Angular DI or produce side effects
  * Both `UserProfile` and `UserProfileMapper` must be exported from the shared library's `public-api.ts` barrel

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — pure type and mapping logic, no I/O
* **Security/Compliance:** No sensitive credentials (passwords, tokens) are part of `UserProfile`
* **Usability/Other:** The type must be importable by both `admin` and `operator` SPAs via the shared library; components must never re-derive `isAdmin`/`isOperator` from `roles` themselves

## 4. Acceptance Criteria (BDD)

**Scenario 1: UserProfile has all required fields including UI flags**

* **Given** the `UserProfile` interface exported from the shared library
* **When** a developer imports it in the `admin` or `operator` app
* **Then** TypeScript exposes: `id: string`, `email: string`, `firstName: string`, `lastName: string`, `roles: string[]`, `isAdmin: boolean`, `isOperator: boolean`

**Scenario 2: Mapper sets isAdmin to true when roles contains ADMIN**

* **Given** a raw response with `roles: ['ADMIN']`
* **When** `UserProfileMapper.fromResponse(response)` is called
* **Then** the returned `UserProfile` has `isAdmin: true` and `isOperator: false`

**Scenario 3: Mapper sets isOperator to true when roles contains OPERATOR**

* **Given** a raw response with `roles: ['OPERATOR']`
* **When** `UserProfileMapper.fromResponse(response)` is called
* **Then** the returned `UserProfile` has `isOperator: true` and `isAdmin: false`

**Scenario 4: Mapper handles multiple roles**

* **Given** a raw response with `roles: ['ADMIN', 'OPERATOR']`
* **When** `UserProfileMapper.fromResponse(response)` is called
* **Then** the returned `UserProfile` has both `isAdmin: true` and `isOperator: true`

**Scenario 5: roles field is an array, not a single string**

* **Given** a `UserProfile` value
* **When** a developer accesses `profile.roles`
* **Then** the type is `string[]`, allowing zero or more role strings

**Scenario 6: No credential fields exist on the model**

* **Given** the `UserProfile` interface
* **When** a developer inspects its type definition
* **Then** there are no fields named `password`, `token`, or `secret`

## 5. Out of Scope

* Role enum values or role-based display metadata beyond `isAdmin` and `isOperator`
* `toRequest()` direction for `UserProfile` — the domain model is read-only (populated from login response)
* Additional role flags beyond `isAdmin` and `isOperator` at this stage
