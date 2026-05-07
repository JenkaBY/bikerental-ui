# User Story: FR-01 — Rental Creation Domain Types & Mapper

## 1. Description

**As a** developer
**I want to** have typed domain interfaces for the rental creation flow (`RentalWrite`, `RentalCostEstimate`, `EquipmentSearchItem`) and a `RentalMapper` that converts them to and from the auto-generated API shapes
**So that** all components in the Create Rental flow import only clean domain types from `core/models/` and remain fully decoupled from the generated API contract

## 2. Context & Business Rules

* **Trigger:** Any component or store in the Create Rental flow needs to read or write rental draft data, calculate costs, or browse available equipment
* **Rules Enforced:**
  * `RentalWrite` must carry: `customerId`, `equipmentIds`, `durationMinutes`, `discountPercent?`, `specialTariffId?`, `specialPrice?`, `operatorId` — mapping 1-to-1 onto `CreateRentalRequest` field names (with `duration` alias for `durationMinutes`)
  * `RentalCostEstimate` must expose: `subtotal`, `totalCost`, `discountAmount?`, `discountPercent?`, `specialPricingApplied`, plus an `equipmentBreakdowns` array where each entry has `equipmentType`, `tariffId`, `itemCost`
  * `EquipmentSearchItem` must expose: `id`, `uid`, `model`, `typeSlug`, `statusSlug` — mapped from `EquipmentResponse`
  * `RentalMapper` is a pure static class — no Angular DI, no side effects
  * `RentalMapper.toCreateRequest(draft: RentalWrite): CreateRentalRequest` must map `durationMinutes` → `duration`; omit optional fields when `undefined`
  * `RentalMapper.toCostCalculationRequest(draft: Partial<RentalWrite>, equipmentTypes: string[]): CostCalculationRequest` must populate `equipments` from the provided `equipmentTypes` array and forward `discountPercent`, `specialTariffId`, `specialPrice`
  * `EquipmentSearchItemMapper.fromResponse(r: EquipmentResponse): EquipmentSearchItem` must map all five fields
  * All new interfaces must be exported from `core/models/index.ts`
  * Components must never import from `core/api/generated/` directly

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — pure data-mapping, no I/O
* **Security/Compliance:** No PII stored in mapper layer; data passes through without persistence
* **Usability/Other:** All interfaces use `readonly` modifiers; `RentalWrite` uses mutable fields to allow incremental signal updates

## 4. Acceptance Criteria (BDD)

**Scenario 1: toCreateRequest maps all required fields**

* **Given** a `RentalWrite` with `customerId: 'uuid-1'`, `equipmentIds: [10, 20]`, `durationMinutes: 120`, `discountPercent: 10`, `operatorId: 'op-1'`
* **When** `RentalMapper.toCreateRequest(draft)` is called
* **Then** the returned `CreateRentalRequest` has `customerId: 'uuid-1'`, `equipmentIds: [10, 20]`, `duration: 120`, `discountPercent: 10`, `operatorId: 'op-1'` and no `specialTariffId` or `specialPrice` fields

**Scenario 2: toCreateRequest handles special price mode**

* **Given** a `RentalWrite` with `specialTariffId: 5`, `specialPrice: 500`, and no `discountPercent`
* **When** `RentalMapper.toCreateRequest(draft)` is called
* **Then** the returned object has `specialTariffId: 5`, `specialPrice: 500` and `discountPercent` is `undefined`

**Scenario 3: toCostCalculationRequest populates equipment types**

* **Given** a partial draft with `durationMinutes: 60`, `discountPercent: 5` and an `equipmentTypes` array of `['bike', 'helmet']`
* **When** `RentalMapper.toCostCalculationRequest(draft, equipmentTypes)` is called
* **Then** the returned `CostCalculationRequest` has `equipments: [{equipmentType: 'bike'}, {equipmentType: 'helmet'}]` and `plannedDurationMinutes: 60`, `discountPercent: 5`

**Scenario 4: EquipmentSearchItemMapper.fromResponse maps correctly**

* **Given** an `EquipmentResponse` with `id: 7`, `uid: 'ABC123'`, `model: 'Trek FX3'`, `type: 'bike'`, `status: 'available'`
* **When** `EquipmentSearchItemMapper.fromResponse(response)` is called
* **Then** the returned `EquipmentSearchItem` has `id: 7`, `uid: 'ABC123'`, `model: 'Trek FX3'`, `typeSlug: 'bike'`, `statusSlug: 'available'`

**Scenario 5: RentalCostEstimate is typed from CostCalculationResponse**

* **Given** a `CostCalculationResponse` with `subtotal: 200`, `totalCost: 180`, `discount: { percent: 10, amount: 20 }`, `specialPricingApplied: false`
* **When** `RentalMapper.fromCostResponse(response)` is called
* **Then** the returned `RentalCostEstimate` has `subtotal: 200`, `totalCost: 180`, `discountPercent: 10`, `discountAmount: 20`, `specialPricingApplied: false`

## 5. Out of Scope

* Persisting any domain objects to local storage or the backend
* Domain types for rental return flow (covered by TASK012)
* Payment-method domain types (covered by `CustomerDepositWrite` / `CustomerWithdrawalWrite` in `customer-balance.model.ts`)
