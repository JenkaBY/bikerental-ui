# System Design: FR-04 — Customer Profile Tab

## 1. Architectural Overview

This story introduces `CustomerProfileComponent` as a thin consumer tab within the Hierarchical State architecture defined in FR-03. The component injects `CustomerLayoutStore` (the Master store) via Angular DI — no `input()` or `output()` bindings are used. Profile data is read directly from the store's `customer` signal; on a successful save the component calls the store's `updateCustomer()` method, which performs the PUT and updates the shared `customer` signal in-place, keeping the shell header and all other tabs consistent without any event wiring.

## 2. Impacted Components

* **`CustomerProfileComponent` (Admin SPA — new, `customers/customer-detail/tabs/customer-profile/customer-profile.component.ts`):** Injects `CustomerLayoutStore`; reads `store.customer` signal to initialise view mode; maintains local `editMode: Signal<boolean>` and a form model; on Save calls `store.updateCustomer(write)`; shows `MatSnackBar` for success and error feedback.

* **`CustomerLayoutStore` (Admin SPA — FR-03):** Must expose an `updateCustomer(write: CustomerWrite)` method that calls `CustomersService.updateCustomer`, maps the response, and updates the `customer` signal on success.

## 3. Abstract Data Schema Changes

No new domain entities. Component uses `Customer` (read, from FR-01) and `CustomerWrite` (write, from FR-01).

* **Local form model (component-scoped, not persisted):**
  - Fields: `phone` (required), `firstName` (required), `lastName` (required), `birthDate` (optional Date), `notes` (optional string)

## 4. Component Contracts & Payloads

* **Interaction: `CustomerProfileComponent` → `CustomerLayoutStore` (inbound read)**
  * **Protocol:** Angular DI injection
  * **Payload Changes:** Component reads `store.customer` signal; no HTTP call on tab activate.

* **Interaction: `CustomerProfileComponent` → `CustomerLayoutStore.updateCustomer(write)`**
  * **Protocol:** In-process store method call
  * **Payload Changes:** Store maps `CustomerWrite` via `CustomerMapper.toRequest(write)` → calls `CustomersService.updateCustomer(id, request)` → on success maps response via `CustomerMapper.fromResponse()` → updates `customer` signal; component switches to view mode and shows success `MatSnackBar`. On error, component remains in edit mode and shows error `MatSnackBar`.

* **Interaction: `CustomerProfileComponent` → `MatSnackBar`**
  * **Protocol:** In-process service call
  * **Payload Changes:** Success message on store update success; error message on store update error.

## 5. Updated Interaction Sequence

1. `CustomerProfileComponent` activates → injects `CustomerLayoutStore` → reads `store.customer` signal → renders view mode with all field values.
2. User clicks Edit → `editMode` set to `true` → form fields rendered with current values pre-filled.
3. User modifies fields → form validity re-evaluated → Save button enabled/disabled reactively.
4. User clicks Save → form valid → `store.updateCustomer(write)` called.
5. Store performs HTTP PUT → response mapped → `store.customer` signal updated → component switches to view mode → success `MatSnackBar` shown → header re-renders with updated name automatically.
6. Store HTTP error → component remains in edit mode → error `MatSnackBar` shown.
7. User clicks Cancel → `editMode` set to `false` → form values reset from `store.customer` signal → view mode rendered.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No auth guards (deferred). Phone, name, email are PII — no additional client-side masking required beyond standard transport security.
* **Scale & Performance:** No HTTP call on tab activate; PUT only on explicit Save action. Form state is purely in-memory; no caching or persistence.
