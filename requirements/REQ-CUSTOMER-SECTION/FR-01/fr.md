# User Story: FR-01 — Customer Domain Model & Mapper

## 1. Description

**As a** developer
**I want to** have typed domain interfaces for Customer, CustomerRentalSummary, CustomerBalance, and CustomerTransaction, plus typed status enums with display metadata (colour, label), plus a CustomerMapper that converts generated API shapes to/from those interfaces
**So that** components can import clean domain types from `core/models/` and remain fully decoupled from auto-generated API shapes

## 2. Context & Business Rules

* **Trigger:** Any component, service, or feature file needs to read or write customer data
* **Rules Enforced:**
  * `customer.model.ts` must export `Customer` (read) and `CustomerWrite` (partial update) interfaces
  * `CustomerResponse.comments` maps to `Customer.notes`; `CustomerWrite.notes` maps back to `CustomerRequest.comments`
  * `firstName`, `lastName`, and `phone` are required in both `CustomerWrite` and `CustomerRequest` (for both POST and PUT); they must never be sent as empty string
  * `email` is an optional supplementary field; it is included in both `Customer` and `CustomerWrite` and mapped 1-to-1 with `CustomerResponse.email` / `CustomerRequest.email`
  * `CustomerMapper` is a pure static class — no Angular DI, no side effects
  * Two status enums with display metadata must be declared in `core/models/`:
    - `RentalStatus` — values: `DRAFT`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `DEBT`; each value carries a `colour` token (`primary` | `accent` | `warn` | `default`) and a `labelKey` string used for i18n
    - `EquipmentItemStatus` — values: `ASSIGNED`, `ACTIVE`, `RETURNED`; each value carries a `colour` token and a `labelKey`
  * Both enums are implemented as typed object maps (not TypeScript `enum` keyword) so that each entry can hold multiple metadata fields alongside the slug
  * A mapper helper `mapRentalStatus(slug: string): RentalStatusMeta` and `mapEquipmentItemStatus(slug: string): EquipmentItemStatusMeta` must be provided for safe lookup with a fallback
  * `CustomerRentalSummary.status` stores the raw string slug; components resolve display metadata via the helper — not stored in the model itself
  * Domain types `CustomerRentalSummary`, `CustomerBalance`, and `CustomerTransaction` must also be declared in `core/models/`
  * Components must never import from `core/api/generated/` directly

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — pure data-mapping, no I/O
* **Security/Compliance:** No PII is stored in the mapper layer; all data passes through without persistence
* **Usability/Other:** All interfaces must be exported from `core/models/index.ts`

## 4. Acceptance Criteria (BDD)

**Scenario 1: fromResponse maps all fields correctly**

* **Given** a `CustomerResponse` with all optional fields populated, including `comments: 'Some note'`
* **When** `CustomerMapper.fromResponse(response)` is called
* **Then** the returned `Customer` has `notes: 'Some note'` and all other fields mapped 1-to-1

**Scenario 1a: Customer interface has required firstName, lastName, and email**

* **Given** the domain type `Customer`
* **When** a developer imports it
* **Then** it exposes: `id: string`, `phone: string`, `firstName: string`, `lastName: string`, `email?: string`, `birthDate?: Date`, `notes?: string`

**Scenario 2: toRequest maps notes back to comments**

* **Given** a `CustomerWrite` with `notes: 'A note'`, `firstName: 'Ivan'`, `lastName: 'Petrov'`
* **When** `CustomerMapper.toRequest(write)` is called
* **Then** the returned `CustomerRequest` has `comments: 'A note'`, `firstName: 'Ivan'`, and `lastName: 'Petrov'`

**Scenario 2a: toRequest maps email field**

* **Given** a `CustomerWrite` with `email: 'ivan@example.com'`
* **When** `CustomerMapper.toRequest(write)` is called
* **Then** the returned `CustomerRequest` has `email: 'ivan@example.com'`

**Scenario 3: CustomerRentalSummary is typed**

* **Given** the domain type `CustomerRentalSummary`
* **When** a developer imports it
* **Then** it exposes: `id: number`, `status: string` (raw slug), `startedAt: Date`, `expectedReturnAt: Date | undefined`, `estimatedCost: number`, `equipmentIds: number[]`

**Scenario 3a: RentalStatus metadata resolves by slug**

* **Given** the helper `mapRentalStatus('ACTIVE')`
* **When** called
* **Then** it returns `{ slug: 'ACTIVE', colour: 'primary', labelKey: '...' }`

**Scenario 3b: RentalStatus unknown slug falls back**

* **Given** the helper `mapRentalStatus('UNKNOWN_VALUE')`
* **When** called
* **Then** it returns a fallback entry with `colour: 'default'`

**Scenario 3c: EquipmentItemStatus metadata resolves by slug**

* **Given** the helper `mapEquipmentItemStatus('RETURNED')`
* **When** called
* **Then** it returns an entry with `colour: 'default'` (neutral/success) and the appropriate `labelKey`

**Scenario 3d: EquipmentItemStatus ACTIVE slug uses warn colour**

* **Given** the helper `mapEquipmentItemStatus('ACTIVE')`
* **When** called
* **Then** it returns an entry with `colour: 'warn'`

**Scenario 3e: EquipmentItemStatus ASSIGNED slug uses primary colour**

* **Given** the helper `mapEquipmentItemStatus('ASSIGNED')`
* **When** called
* **Then** it returns an entry with `colour: 'primary'` (reserved/waiting state)

**Scenario 4: CustomerBalance is typed**

* **Given** the domain type `CustomerBalance`
* **When** a developer imports it
* **Then** it exposes: `available: number` (from `walletBalance`), `reserved: number` (from `holdBalance`), `lastUpdatedAt: Date`

**Scenario 5: CustomerTransaction is typed**

* **Given** the domain type `CustomerTransaction`
* **When** a developer imports it
* **Then** it exposes: `transactionId: string`, `recordedAt: Date`, `amount: number`, `description: string | undefined`, `sourceType: string | undefined`

## 5. Out of Scope

* Creating or deleting customers (only read + update mapping required for this section)
* Rental equipment item detail mapping (that is part of FR-05, loaded on-demand)
* Store/cache layer — components call services directly
* Email format validation — that belongs in the form layer (FR-04)
