# System Design: FR-02 — Customer List Screen

## 1. Architectural Overview

This story replaces the existing stub `CustomerListComponent` in the Admin SPA with a fully functional, responsive screen at the `/customers` route. The component is a smart, standalone UI element that interacts directly with the generated `CustomersService` to load and filter the customer list. No new services, stores, or shared components are introduced; the Admin routing configuration requires a minor update to wire the new implementation.

The screen adapts its layout between a card-per-item view (mobile) and a tabular view (desktop) entirely within a single component using responsive CSS breakpoints. Search filtering is delegated to the backend via the `GET /api/customers?phone=` endpoint, debounced on the client side to avoid excessive API calls.

## 2. Impacted Components

* **`CustomerListComponent` (Admin SPA — `customers/customer-list.component.ts`):** Full replacement of the placeholder. Responsibilities: load customer list on init, debounce search input changes and re-query, render cards (mobile) or table (desktop), navigate to detail on row/card click, show empty-state and error-state feedback.

* **Admin App Routes (`app.routes.ts`):** Verify the `customers` route points to the new `CustomerListComponent` implementation; no structural route changes required.

## 3. Abstract Data Schema Changes

No new domain entities introduced. The component reads `Customer` (domain type from FR-01) mapped from `CustomerSearchResponse` via `CustomerMapper`.

* **Read shape used:** `id`, `phone`, `firstName`, `lastName` — the subset returned by the search endpoint.

## 4. Component Contracts & Payloads

* **Interaction: `CustomerListComponent` → `CustomersService.searchByPhone`**
  * **Protocol:** HTTP GET — `/api/customers?phone={query}`
  * **Payload Changes:** `phone` query param is an empty string for the initial full-list load; subsequent calls pass the debounced search term. Response is `CustomerSearchResponse[]`; each item is mapped to a lightweight `CustomerSummary` display shape (or the full `Customer` type if the search endpoint returns all fields).

* **Interaction: `CustomerListComponent` → Angular Router**
  * **Protocol:** In-process navigation call
  * **Payload Changes:** Navigates to `/customers/:id` using the `id` from the selected `CustomerSearchResponse`.

## 5. Updated Interaction Sequence

1. `CustomerListComponent` initialises → emits empty search term → `CustomersService.searchByPhone('')` called → response mapped → list signal populated → UI renders.
2. User types in search field → input signal updated → 300 ms debounce elapses → `CustomersService.searchByPhone(query)` called → list signal updated → UI re-renders.
3. User clears search field → 300 ms debounce → `CustomersService.searchByPhone('')` called → full list restored.
4. API returns empty array → empty-state message rendered; no cards or rows shown.
5. API returns HTTP error → `MatSnackBar` error message shown; list signal set to empty array.
6. User clicks a card or table row → `Router.navigate(['/customers', id])`.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No auth guards on this route (deferred per project constraints); all admin routes currently open.
* **Scale & Performance:** Debounce of 300 ms applied client-side before every API call; the search endpoint returns all matching results in a single response (no pagination on this screen). Loading indicator displayed during HTTP in-flight state.
