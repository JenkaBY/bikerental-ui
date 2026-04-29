# System Design: FR-10 — Create Customer Dialog

## 1. Architectural Overview

This story introduces the customer-creation entry point within the Admin application's Customer section. It follows the established Admin CRUD pattern: a trigger control embedded in the `CustomerListComponent` toolbar opens a purpose-built `CustomerCreateDialogComponent` via `MatDialog`. On success, instead of the standard list-reload, the dialog outcome drives a client-side navigation to the newly created customer's detail route (`/customers/:id`), making the create flow a one-way transition rather than a list refresh.

The data pipeline is unchanged — `CustomerCreateDialogComponent` delegates persistence to `CustomerStore.create()`, which calls the auto-generated `CustomersService.createCustomer()` mapped through `CustomerMapper`. The dialog itself holds no domain state beyond the transient reactive form; all routing side effects are handled inside the dialog via Angular Router after `MatDialogRef.close()`.

The create trigger is a single `mat-raised-button` labelled "New Customer" rendered inline in the list header alongside the search input, visible at all viewport widths.

## 2. Impacted Components

* **`CustomerListComponent` (Admin — `customers/customers-list/`):** Must be extended with a "New Customer" `mat-raised-button` rendered inline in the list header alongside the search input. The button is visible at all viewport widths and calls `openCreateDialog()`. No list-reload is triggered after dialog closure (navigation replaces it).

* **`CustomerCreateDialogComponent` (Admin — `customers/dialogs/customer-create-dialog/`):** New component. Receives no input data via `MAT_DIALOG_DATA` (always create mode). Renders a reactive form with six fields: phone (required, non-empty text), firstName (required, non-empty text), lastName (required, non-empty text), email (optional, email-format validation), dateOfBirth (optional, date picker), notes (optional, textarea). The Confirm button is disabled while the form is invalid and also during the in-flight HTTP request (loading state). On HTTP success the dialog closes with the new customer's `id` and the Router navigates to `/customers/:id`. On HTTP error a `MatSnackBar` error message is shown and the dialog remains open with the Confirm button re-enabled. Cancel always closes the dialog with `undefined` and no side effects.

* **`CustomerStore` (Shared Library — `core/state/customer.store.ts`):** Must expose a `create(write: CustomerWrite): Observable<Customer>` method that calls the generated `CustomersService.createCustomer(CustomerMapper.toCreateRequest(write))`, maps the response via `CustomerMapper.fromResponse()`, and emits the created `Customer`. The returned `Customer.id` is used by the dialog to build the navigation target.

* **`CustomerMapper` (Shared Library — `core/mappers/customer.mapper.ts`):** Must be extended with a `toCreateRequest(w: CustomerWrite): CustomerRequest` method if not already present, producing the `POST /api/customers` request body from the `CustomerWrite` domain object.

## 3. Abstract Data Schema Changes

* **Entity: `CustomerWrite`**
  * **Attributes Used (no new attributes):** `phone` (string, required), `firstName` (string, required), `lastName` (string, required), `email` (string, optional), `birthDate` (Date, optional), `notes` (string, optional). All attributes already defined in FR-01; no schema changes required.

* **Relations:** None. Customer creation produces a new `Customer` entity in the backend store; no relational changes are triggered on the frontend data model.

## 4. Component Contracts & Payloads

* **Interaction: `CustomerListComponent` → `MatDialog` → `CustomerCreateDialogComponent`**
  * **Protocol:** In-process Angular Material dialog open
  * **Payload Changes:** No `MAT_DIALOG_DATA` payload is required; the dialog is always in create mode and initialises its form empty.

* **Interaction: `CustomerCreateDialogComponent` → `CustomerStore.create()`**
  * **Protocol:** HTTP POST — `POST /api/customers`
  * **Payload Changes:** Request body carries `phone` (required), `firstName` (required), `lastName` (required), and optionally `email`, `birthDate` (ISO-8601 date string), `notes` (mapped from UI `notes` → API `comments` per existing mapper convention). Response carries the created `Customer` including its server-assigned `id`.

* **Interaction: `CustomerCreateDialogComponent` → `MatDialogRef`**
  * **Protocol:** In-process close signal
  * **Payload Changes:** On success, closes with the new customer's `id` (string/UUID). On cancel, closes with `undefined`.

* **Interaction: `CustomerListComponent` → Angular Router (post-close)**
  * **Protocol:** In-process Angular Router navigation
  * **Payload Changes:** After `afterClosed()` emits a truthy `id`, the list component (or the dialog itself via injected Router) navigates to `/customers/:id`.

## 5. Updated Interaction Sequence

**Happy path — successful customer creation:**

1. `CustomerListComponent` renders an inline "New Customer" button in its header alongside the search input.
2. User activates the create trigger; `CustomerListComponent.openCreateDialog()` calls `MatDialog.open(CustomerCreateDialogComponent, { data: {} })`.
3. `CustomerCreateDialogComponent` initialises an empty reactive form; the Confirm button is disabled (form invalid).
4. User fills in at minimum phone, firstName, and lastName; form becomes valid; Confirm button is enabled.
5. User clicks Confirm; the dialog sets a loading signal to `true` and disables the Confirm button.
6. `CustomerCreateDialogComponent` maps the form value to `CustomerWrite` and calls `CustomerStore.create(customerWrite)`.
7. `CustomerStore` calls `CustomerMapper.toCreateRequest(write)` and delegates to `CustomersService (generated).createCustomer(request)`.
8. Generated service issues `POST /api/customers` with the request body via `HttpClient`.
9. Backend returns `201 Created` with the new `Customer` payload including `id`.
10. `CustomerStore` maps the response via `CustomerMapper.fromResponse(response)` and emits `Customer`.
11. `CustomerCreateDialogComponent` calls `MatDialogRef.close(customer.id)`.
12. `CustomerListComponent.afterClosed()` subscription receives the `id`; the component calls `Router.navigate(['/customers', id])`.
13. Angular Router navigates to `CustomerDetailComponent` at `/customers/:id`.

**Unhappy path — API error:**

1. Steps 1–8 as above.
2. Backend returns a `4xx` or `5xx` response; `errorInterceptor` does not suppress the error (FR-10 requires dialog-local handling).
3. `CustomerCreateDialogComponent` catches the error in `catchError`; sets loading signal to `false`; re-enables the Confirm button.
4. `MatSnackBar.open()` is called with a localised error message; the dialog remains open.
5. User may correct input and retry (step 4 onward) or click Cancel.

**Cancel path:**

1. User clicks Cancel at any point while the dialog is open and no in-flight request is pending.
2. `MatDialogRef.close(undefined)` is called; no API call is made.
3. `CustomerListComponent.afterClosed()` receives `undefined`; no navigation and no list reload occurs.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Client-side validation ensures `phone`, `firstName`, and `lastName` are non-empty strings before any HTTP call is dispatched. Empty or whitespace values must be rejected by the reactive form's validators so they are never transmitted. No PII is logged.

* **Scale & Performance:** A single `POST /api/customers` call is issued per confirmation attempt. No pre-loading or background data fetching is required for this dialog (no lookup dropdowns). The loading signal disables the Confirm button for the duration of the request, preventing duplicate submissions.


