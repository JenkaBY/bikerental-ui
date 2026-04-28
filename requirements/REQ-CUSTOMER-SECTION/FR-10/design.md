# System Design: FR-10 — Create Customer Dialog

## 1. Architectural Overview

FR-10 extends the **Admin** SPA by adding a customer-creation capability directly to the Customer List screen. It follows the established admin CRUD pattern: the list component gains an entry-point control (responsive: FAB on mobile, toolbar button on desktop) that opens a modal dialog. The dialog owns the creation form and calls the wrapper `CustomersService` (admin layer), which in turn delegates to the generated `CustomersService` via `CustomerMapper`. No new backend endpoints are required — the existing `POST /api/customers` endpoint already supports this operation.

The post-creation flow departs from the standard "refresh list" pattern used by other CRUD features: on success the dialog closes and the router navigates the user directly to the new customer's detail page (`/customers/:id`), providing immediate access to profile editing. This keeps the creation path lightweight while avoiding a redundant list reload.

---

## 2. Impacted Components

* **`CustomerListComponent` (Admin — `/customers`):**
  Must gain two new entry-point controls: a `MatMiniFab` fixed to the bottom-right of the viewport on mobile viewports (`< md`), and a standard action button rendered inside the list header alongside the search input on desktop viewports (`≥ md`). Both controls open the `CustomerCreateDialogComponent` via `MatDialog`. The component must also inject `Router` to perform post-creation navigation when the dialog closes with a non-falsy result containing the new customer's `id`.

* **`CustomerCreateDialogComponent` (New — Admin `customers/dialogs/customer-create-dialog/`):**
  New standalone dialog component. Owns a reactive form with six fields: `phone` (required), `firstName` (required), `lastName` (required), `email` (optional, email format), `birthDate` (optional, date), `notes` (optional, textarea). Manages a loading signal. On submit: delegates to the admin-layer `CustomersService.create(CustomerWrite)`, closes with the resulting `Customer.id` on success, or shows a `MatSnackBar` error and keeps the dialog open on failure. No `MAT_DIALOG_DATA` input is needed (creation context carries no seed data).

* **`CustomersService` (Admin wrapper — `core/api/`):**
  Must expose a new `create(write: CustomerWrite): Observable<Customer>` method. This method calls `CustomerMapper.toRequest(write)` to convert the domain write model to the API shape, invokes the generated `CustomersService.createCustomer(request)`, then maps the response back via `CustomerMapper.fromResponse(response)`.

* **`CustomersService` (generated — `core/api/generated/`):**
  Already exposes a `createCustomer(request: CustomerRequest)` method (or equivalent; confirmed by existing `POST /api/customers` backend endpoint). No change required to the generated code.

* **`CustomerMapper` (Shared — `core/mappers/`):**
  The `toRequest(write: CustomerWrite): CustomerRequest` method already exists (per FR-01). No new mapper method is needed; the existing implementation satisfies the creation payload requirement.

---

## 3. Abstract Data Schema Changes

No new persistent entities or schema changes are required. The `Customer` and `CustomerWrite` domain models (introduced in FR-01) are sufficient.

* **Entity: `Customer`** — no changes; the `id` field returned by the creation response is used for navigation.
* **Entity: `CustomerWrite`** — no changes; phone, firstName, lastName are already required; email, birthDate, notes are already optional.

---

## 4. Component Contracts & Payloads

* **Interaction: `CustomerListComponent` → `MatDialog` → `CustomerCreateDialogComponent`**
  * **Protocol:** In-process Angular Material dialog
  * **Payload Changes:** `MatDialog.open(CustomerCreateDialogComponent, {})` — no `data` input required. Dialog emits the new customer's `id: string` on success (dialog closes with `{ id: string }`), or `undefined` on cancel.

* **Interaction: `CustomerCreateDialogComponent` → `CustomersService` (admin wrapper)**
  * **Protocol:** Observable method call (in-process)
  * **Payload Changes:** Passes `CustomerWrite` domain object (`{ phone, firstName, lastName, email?, birthDate?, notes? }`). Receives `Customer` domain object; only `id` is consumed for navigation.

* **Interaction: `CustomersService` (admin wrapper) → `CustomersService` (generated)**
  * **Protocol:** Observable method call (in-process)
  * **Payload Changes:** Passes `CustomerRequest` (mapped from `CustomerWrite` via `CustomerMapper.toRequest`). Receives `CustomerResponse`; the wrapper maps it back to `Customer` via `CustomerMapper.fromResponse`.

* **Interaction: `CustomersService` (generated) → Backend REST API**
  * **Protocol:** REST / HTTP POST
  * **Payload Changes:** `POST /api/customers` with `CustomerRequest` body — no backend change needed. Response: `CustomerResponse` including `id`.

* **Interaction: `CustomerCreateDialogComponent` → `MatDialogRef`**
  * **Protocol:** In-process Angular Material dialog close
  * **Payload Changes:** `close({ id: string })` on HTTP success; `close(undefined)` on cancel.

* **Interaction: `CustomerListComponent` → `Router`**
  * **Protocol:** In-process Angular Router navigation
  * **Payload Changes:** On `afterClosed()` result with a defined `id`, navigates to `['/customers', result.id]`.

---

## 5. Updated Interaction Sequence

**Happy Path — Customer creation and navigation:**

1. User is on `/customers`. On mobile the FAB is visible; on desktop the "New Customer" toolbar button is visible.
2. User activates the entry-point control (tap FAB or click button).
3. `CustomerListComponent` calls `MatDialog.open(CustomerCreateDialogComponent, {})`.
4. `CustomerCreateDialogComponent` renders with an empty form. The Confirm button is disabled because required fields are blank.
5. User fills in `phone`, `firstName`, `lastName` (and optionally `email`, `birthDate`, `notes`).
6. Form becomes valid; Confirm button is enabled.
7. User clicks Confirm.
8. `CustomerCreateDialogComponent` sets loading state `true`, disables Confirm button.
9. `CustomerCreateDialogComponent` calls `CustomersService.create(customerWrite)`.
10. Admin `CustomersService` calls `CustomerMapper.toRequest(write)` to produce `CustomerRequest`.
11. Admin `CustomersService` calls generated `CustomersService.createCustomer(customerRequest)`.
12. Generated service executes `POST /api/customers` with the request payload.
13. Backend returns `201 Created` with `CustomerResponse` (including `id`).
14. Admin `CustomersService` calls `CustomerMapper.fromResponse(response)` and emits the `Customer` domain object.
15. `CustomerCreateDialogComponent` calls `MatDialogRef.close({ id: customer.id })`.
16. `CustomerListComponent.afterClosed()` receives `{ id }`.
17. `CustomerListComponent` calls `Router.navigate(['/customers', id])`.
18. Angular Router activates the `CustomerDetailComponent` for the new customer.

**Unhappy Path — API error:**

1–12. Same as above through the HTTP POST step.

13. Backend returns `4xx` or `5xx`.
14. `CustomerCreateDialogComponent` catches the error, sets loading `false`, re-enables Confirm.
15. A `MatSnackBar` error notification is shown; the dialog remains open.
16. The user may correct input and retry, or click Cancel to dismiss the dialog with no side effects.

**Unhappy Path — User cancels:**

1–4. Same as above.

5. User clicks Cancel at any point.
6. `CustomerCreateDialogComponent` calls `MatDialogRef.close(undefined)`.
7. `CustomerListComponent.afterClosed()` receives `undefined`; no navigation is performed.

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** All routes are currently open (TASK002 deferred). The `POST /api/customers` endpoint is called with the same HTTP client configuration (base interceptors, base URL) as all other API calls. Phone, firstName, and lastName are validated client-side to be non-empty strings before the request is sent, preventing accidental empty-string submissions.

* **Scale & Performance:** The creation dialog issues a single `POST` request. No caching invalidation is needed for the list because the post-creation flow navigates away from the list entirely. The Confirm button loading state prevents duplicate submissions while the request is in flight. No debounce or queuing is required.
