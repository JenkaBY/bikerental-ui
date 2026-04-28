# System Design: FR-01 — Customer Domain Model & Mapper

## 1. Architectural Overview

This story introduces the foundational domain layer for the Customer section. It populates two currently empty files in the Shared Library — `customer.model.ts` and `customer.mapper.ts` — and adds two new status-metadata maps alongside their lookup helpers. No new components or HTTP interactions are introduced; this story operates entirely within the data-pipeline boundary between the auto-generated API layer and the UI domain layer.

All downstream stories (FR-02 through FR-09) depend on the types and helpers defined here. The status metadata maps (`RentalStatus`, `EquipmentItemStatus`) are also shared across the Admin and Operator feature areas wherever rental or equipment item data is displayed with colour-coded chips.

## 2. Impacted Components

* **`customer.model.ts` (Shared Library — Domain Models):** Must be fully implemented. Export `Money` (immutable value object), `Customer` (read interface), `CustomerWrite` (update interface), `CustomerRentalSummary`, `CustomerBalance`, and `CustomerTransaction` domain interfaces. Export `RentalStatusMeta` and `EquipmentItemStatusMeta` descriptor interfaces, the `RentalStatus` and `EquipmentItemStatus` typed object maps, and the helper functions `mapRentalStatus` and `mapEquipmentItemStatus`.

* **`customer.mapper.ts` (Shared Library — Mappers):** Must be fully implemented. Export `CustomerMapper` as a pure static class with `fromResponse(r: CustomerResponse): Customer` and `toRequest(w: CustomerWrite): CustomerRequest` methods.

* **`core/models/index.ts` (Shared Library — Models Barrel):** Must re-export all new types so consuming code imports from a single barrel path.

## 3. Abstract Data Schema Changes

* **Entity: `Customer`**
  * **Attributes Added:** `id` (UUID string, read-only), `phone` (string, required), `firstName` (string, required), `lastName` (string, required), `email` (string, optional), `birthDate` (Date, optional), `notes` (string, optional — maps to/from API field `comments`)

* **Entity: `CustomerWrite`**
  * **Attributes Added:** `phone` (string, required), `firstName` (string, required), `lastName` (string, required), `email` (string, optional), `birthDate` (Date, optional), `notes` (string, optional)

* **Entity: `Money`**
  * **Attributes Added:** `amount` (number — monetary value), `currency` (ISO 4217 string, default `'BYN'`). Immutable value object; constructed by the mapper from a bare API `number` plus the shop's default currency `'BYN'`. Never sent to the API as a nested object — mapper extracts `amount` before building request payloads.

* **Entity: `CustomerRentalSummary`**
  * **Attributes Added:** `id` (integer), `status` (string slug — raw value), `startedAt` (Date), `expectedReturnAt` (Date, optional), `estimatedCost` (`Money`), `equipmentIds` (integer array)

* **Entity: `CustomerBalance`**
  * **Attributes Added:** `available` (`Money` — mapped from `walletBalance`), `reserved` (`Money` — mapped from `holdBalance`), `lastUpdatedAt` (Date)

* **Entity: `CustomerTransaction`**
  * **Attributes Added:** `transactionId` (UUID string), `recordedAt` (Date), `amount` (`Money`), `description` (string, optional), `sourceType` (string, optional), `amountColor` (string — UI presentation property; derived from `amount.amount` sign: `'positive'` when `amount.amount > 0`, `'negative'` when `amount.amount < 0`, `'neutral'` as default; set by the mapper at construction time, never sent to the API)

* **Entity: `RentalStatusMeta`**
  * **Attributes Added:** `slug` (string), `colour` (`primary` | `accent` | `warn` | `default`), `labelKey` (string)
  * **Object map entries:** `DRAFT` (default), `ACTIVE` (primary), `COMPLETED` (default), `CANCELLED` (default), `DEBT` (warn)

* **Entity: `EquipmentItemStatusMeta`**
  * **Attributes Added:** `slug` (string), `colour` (`primary` | `accent` | `warn` | `default`), `labelKey` (string)
  * **Object map entries:** `ASSIGNED` (primary — reserved/waiting), `ACTIVE` (warn — in active use), `RETURNED` (default — completed)

## 4. Component Contracts & Payloads

* **Interaction: `CustomerMapper` → `CustomerResponse` (inbound)**
  * **Protocol:** In-process function call
  * **Payload Changes:** `comments` field mapped to `notes`; all other fields passed through 1-to-1; `birthDate` kept as `Date`

* **Interaction: `CustomerMapper` → `CustomerRequest` (outbound)**
  * **Protocol:** In-process function call
  * **Payload Changes:** `notes` field mapped back to `comments`; `phone`, `firstName`, `lastName` are required and must not be omitted; optional fields sent as `undefined` when absent

* **Interaction: `mapRentalStatus(slug)` → `RentalStatusMeta`**
  * **Protocol:** In-process function call
  * **Payload Changes:** Unknown slugs fall back to `{ colour: 'default' }` — no exception thrown

* **Interaction: `mapEquipmentItemStatus(slug)` → `EquipmentItemStatusMeta`**
  * **Protocol:** In-process function call
  * **Payload Changes:** Unknown slugs fall back to `{ colour: 'default' }` — no exception thrown

## 5. Updated Interaction Sequence

1. Any component or service that reads a `CustomerResponse` passes it to `CustomerMapper.fromResponse(r)` to obtain a `Customer` domain object.
2. Any component that writes a customer profile creates a `CustomerWrite` object and passes it to `CustomerMapper.toRequest(w)` to obtain the `CustomerRequest` payload before calling the API.
3. Any component that displays a rental status chip calls `mapRentalStatus(status)` to obtain the `colour` and `labelKey` for rendering.
4. Any component that displays an equipment item status chip calls `mapEquipmentItemStatus(status)` to obtain the `colour` and `labelKey`.
5. Unknown status slugs do not throw — a default fallback descriptor is returned, ensuring resilience against backend enum additions.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is stored or transformed beyond a direct field copy; mapper adds no persistence or logging.
* **Scale & Performance:** All functions are pure and synchronous; no caching, no async calls, no side effects. Zero performance overhead.
