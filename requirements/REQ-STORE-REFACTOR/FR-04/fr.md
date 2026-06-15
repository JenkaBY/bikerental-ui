# User Story: FR-04 — Standardize Shared Import Paths + Lint Guard

## 1. Description

**As a** developer working across the `admin`, `operator`, and `shared` projects
**I want to** import shared symbols through one canonical path
**So that** dependency injection behaves predictably and refactors don't silently break `useExisting`
aliases or provider overrides

## 2. Context & Business Rules

* **Trigger:** The same shared classes are imported three ways today (review §1.4):
  * `@bikerental/shared` (public barrel) — intended.
  * `@store.*` per-file alias → `projects/shared/src/core/state/*`
    ([tsconfig.json:22](../../../tsconfig.json)).
  * deep relative across projects, e.g.
    [customer-transactions.store.ts:6](../../../projects/admin/src/app/customers/customer-detail/customer-transactions.store.ts).
* **Rules Enforced:**
  * **Cross-project imports** (from `admin`/`operator`/`gateway` into `shared`) must use
    `@bikerental/shared` only.
  * `@store.*` is **either** removed, **or** restricted to use *inside* the `shared` library itself
    (where the barrel can't be used without self-import). Choose one and apply consistently; document the
    decision in `AGENTS.md`.
  * An ESLint `no-restricted-imports` (or `@nx`/`boundaries`-style) rule enforces the convention so
    regressions fail CI. The rule forbids `*/shared/src/*` deep paths and, outside `shared`, the
    `@store.*` alias.
  * No runtime behavior changes — imports only.

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A.
* **Security/Compliance:** N/A.
* **Usability/Other:** `npm run fix` and the lint stage must pass with the new rule active.

## 4. Acceptance Criteria (BDD)

**Scenario 1: One cross-project convention**
* **Given** the refactored repo
* **When** scanning `projects/admin` and `projects/operator` imports of shared code
* **Then** every such import uses `@bikerental/shared`

**Scenario 2: Lint blocks regressions**
* **Given** the new ESLint rule
* **When** a developer adds a deep relative import into `shared/src`
* **Then** `npm run lint` reports an error on that line

**Scenario 3: DI still resolves**
* **Given** the import changes
* **When** the apps build and the test suite runs
* **Then** all `useExisting`/token providers resolve and all tests pass

## 5. Out of Scope

* Restructuring the barrel's exports or the `@store.*` target folders.
* Any store/model logic change.
