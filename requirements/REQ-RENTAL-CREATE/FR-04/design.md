# System Design: FR-04 — Step 1: Customer Selection

## 1. Architectural Overview

This story implements the component tree for Step 1 of the Create Rental stepper. Following the project decomposition principle, `RentalStep1Component` is a smart orchestrator that injects `RentalStore` and composes two focused child components: `CustomerSearchInputComponent` (smart — owns the debounced HTTP search and result rendering) and `CustomerCreateInlineFormComponent` (smart — owns the create POST and inline form state). Neither child holds persistent state; all final mutations are forwarded to `RentalStore` by the parent step component.

A `CustomerMapper.fromResponse()` usage is assumed to already exist (or is trivially extended) to produce the `Customer` domain model that `RentalStore` expects. Navigating back from Step 2 re-renders the step; the parent reads `RentalStore.customer` to pre-populate the search input.

## 2. Impacted Components

* **`operator` — new `RentalStep1Component` (smart):**
  Injected with `RentalStore`. Template contains only `CustomerSearchInputComponent`. Listens to `customerSelected` output; calls `RentalStore.setCustomer()` and signals the stepper to advance to Step 2. On init, reads `RentalStore.customer` and passes the phone number down to `CustomerSearchInputComponent` as an initial value input.

* **`operator` — new `CustomerSearchInputComponent` (smart):**
  Owns the phone-number `mat-autocomplete` field. Injects `CustomersService`. Performs the debounced `GET /api/customers?phone={query}` search (300 ms, min 3 chars, `switchMap`). Renders search results as `CustomerSearchOptionComponent` items inside the autocomplete panel. When no results are returned, renders a "Create new customer" option that conditionally shows `CustomerCreateInlineFormComponent` inside the panel. Emits a `customerSelected` output with the chosen `Customer` domain object. Receives `initialPhone` as an optional input.

* **`operator` — new `CustomerSearchOptionComponent` (dumb):**
  Renders a single autocomplete option row: customer phone, first name, and last name. Receives a `Customer` input. No logic, no injections.

* **`operator` — new `CustomerCreateInlineFormComponent` (smart):**
  Renders the inline create form (phone read-only, first name required, last name required). Injects `CustomersService`. On submit, calls `POST /api/customers`; maps the response via `CustomerMapper.fromResponse()` and emits `customerCreated` output with the new `Customer`. Disables the submit button while the POST is in flight. On error, shows a snackbar and keeps the form open. Receives `phone` as a required input (pre-filled, read-only).

* **`shared` (Shared Library) — `CustomerMapper` (existing):**
  Must expose `fromResponse(r: CustomerResponse): Customer` if not already present.

## 3. Abstract Data Schema Changes

No new persistent entities. The inline create form accepts a transient payload:

* **Transient form payload (in-memory only):**
  * `phone` (String, required — pre-filled from search query)
  * `firstName` (String, required)
  * `lastName` (String, required)

## 4. Component Contracts & Payloads

* **Interaction: `RentalStep1Component` -> `CustomersService` (generated)**
  * **Protocol:** HTTP GET, debounced 300 ms, minimum query length 3 characters
  * **Payload Changes:** `GET /api/customers?phone={query}` — returns `CustomerResponse[]`; each result is mapped via `CustomerMapper.fromResponse()` and displayed in the dropdown

* **Interaction: `RentalStep1Component` -> `CustomersService` (generated)**
  * **Protocol:** HTTP POST
  * **Payload Changes:** `POST /api/customers` — body: `{ phone, firstName, lastName }`; response is mapped to `Customer` domain type

* **Interaction: `RentalStep1Component` -> `RentalStore`**
  * **Protocol:** In-process method call
  * **Payload Changes:** `RentalStore.setCustomer(customer: Customer)` — stores the selected or newly created customer and signals the stepper to advance to Step 2

## 5. Updated Interaction Sequence

**Happy path — selecting an existing customer:**

1. Operator types ≥ 3 characters in the phone input.
2. After 300 ms debounce, `GET /api/customers?phone={query}` is called; any in-flight request is cancelled.
3. Results are mapped to `Customer[]` and rendered in the autocomplete dropdown.
4. Operator selects a customer.
5. `RentalStore.setCustomer(customer)` is called.
6. Stepper advances to Step 2.

**Happy path — creating a new customer:**

1. API returns an empty list; a "Create new customer" option appears at the bottom of the dropdown.
2. Operator selects "Create new customer"; an inline form expands with the phone field pre-filled.
3. Operator fills first name and last name; taps "Add customer".
4. `POST /api/customers` is called with `{ phone, firstName, lastName }`.
5. On success: response is mapped to `Customer`; `RentalStore.setCustomer(customer)` is called; stepper advances to Step 2.
6. On error: snackbar notification is shown; inline form remains open for retry.

**Unhappy path — create form with missing required fields:**

1. Operator taps "Add customer" without filling first name or last name.
2. Validation errors are shown on the empty fields; no API call is made.

**Back-navigation — returning to Step 1:**

1. Operator navigates back from Step 2.
2. `RentalCreateComponent` re-renders Step 1.
3. Component reads `RentalStore.customer` signal on init; if non-null, pre-fills the search input with the customer's phone number and shows the customer as selected.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Phone numbers are transmitted over HTTPS and are not logged at the component level. The phone input uses `type="tel"` to invoke a numeric soft keyboard on mobile devices.
* **Scale & Performance:** Debounced search at 300 ms with `switchMap` cancels in-flight requests on new keystrokes. Minimum 3-character threshold prevents unnecessary calls on very short inputs. The "Add customer" button is disabled while the POST is in flight to prevent double-submission.
