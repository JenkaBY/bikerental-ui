# System Design: FR-08 — Dashboard Draft Resume Card

## 1. Architectural Overview

This story evolves the existing `DashboardComponent` placeholder in the `operator` project from a stub into a functional screen that surfaces a saved rental draft when one exists. Following the project decomposition principle, `DashboardComponent` is a smart orchestrator that owns all API calls and business logic, while `DraftResumeCardComponent` is a dumb presentational component that only renders data passed as inputs and emits user intent as outputs.

On component init, the dashboard performs a single GET call to check for DRAFT rentals. If a draft is found, `DraftResumeCardComponent` is rendered above the main dashboard content. The card emits `resumeRequested` and `discardRequested` outputs; `DashboardComponent` handles routing and the discard PATCH call (after a confirmation dialog). No polling occurs; the draft state is held in a local signal on the dashboard and is not shared with any store.

## 2. Impacted Components

* **`operator` — `DashboardComponent` (placeholder → functional, smart):**
  Injects `RentalsService`, `Router`, `MatDialog`, and `MatSnackBar`. Calls `GET /api/rentals?status=DRAFT&size=1` on init; maps the result to `RentalSummary` and stores it in a local `draftRental` signal. Conditionally renders `DraftResumeCardComponent`. Handles `resumeRequested` output by navigating to `/rentals/new?id={id}`. Handles `discardRequested` output by opening a confirmation dialog; on confirmation calls `PATCH /api/rentals/{id}`; on success sets `draftRental` to `null`; on error shows snackbar.

* **`operator` — new `DraftResumeCardComponent` (dumb):**
  Pure presentational component. Receives `rental` (`RentalSummary`) as a required input. Renders: "Draft rental" label, last-updated timestamp, customer name/phone (if attached). Contains "Resume" and "Discard" buttons. Emits `resumeRequested` and `discardRequested` outputs. Injects no services; performs no API calls; opens no dialogs. Composes `DashboardCardComponent` from `shared` as its visual container.

* **`shared` — `DashboardCardComponent` (existing, reused):**
  No changes; `DraftResumeCardComponent` uses it as the outer visual shell with a distinct accent colour or icon.

## 3. Abstract Data Schema Changes

No new persistent entities. A transient read-only view of a draft rental is introduced for display:

* **`RentalSummary`** (new read-only domain model or projected subset, in `core/models/`)
  * **Attributes:** `id` (Integer), `status` (Enum), `updatedAt` (Timestamp), `customer` (Customer | null)

* **Mapper extension:** `RentalMapper.fromSummaryResponse(r: RentalResponse): RentalSummary` maps the fields above from the generated `RentalResponse` type.

## 4. Component Contracts & Payloads

* **Interaction: `DashboardComponent` -> `RentalsService` (generated)**
  * **Protocol:** HTTP GET (once on component init)
  * **Payload Changes:** `GET /api/rentals?status=DRAFT&size=1` — returns a paginated result; the first item (if any) is mapped to `RentalSummary` and stored in the `draftRental` signal

* **Interaction: `DraftResumeCardComponent` -> Angular Router (via parent)**
  * **Protocol:** Imperative `Router.navigate()` triggered by the "Resume" button
  * **Payload Changes:** Navigates to `/rentals/new?id={draftRental.id}`

* **Interaction: `DashboardComponent` -> `RentalsService` (generated)**
  * **Protocol:** HTTP PATCH (conditional — triggered by "Discard" after confirmation)
  * **Payload Changes:** `PATCH /api/rentals/{id}` — body: `[{ op: 'replace', path: '/status', value: 'CANCELLED' }]`; on success: `draftRental` signal is set to `null`, removing the card; on error: snackbar notification shown, card remains

* **Interaction: `DashboardComponent` -> `MatDialog` (confirmation dialog)**
  * **Protocol:** `MatDialog.open()` (inline confirmation dialog or `MatDialog` with a generic confirm component)
  * **Payload Changes:** Confirmation prompt text; on confirm: PATCH call is made; on cancel: no action

## 5. Updated Interaction Sequence

**Happy path — draft exists, operator resumes:**

1. Dashboard component initialises; `GET /api/rentals?status=DRAFT&size=1` is called.
2. Response contains one DRAFT rental; it is mapped to `RentalSummary` and stored in `draftRental`.
3. `DraftResumeCardComponent` renders with the draft timestamp and customer info.
4. Operator taps "Resume"; router navigates to `/rentals/new?id={draftRental.id}`.
5. `RentalCreateComponent` loads the draft via `RentalStore.loadRental(id)` (FR-03).

**Happy path — no draft exists:**

1. Dashboard initialises; GET returns empty page.
2. `draftRental` remains `null`; no card is rendered.

**Happy path — operator discards the draft:**

1. Operator taps "Discard" on the card.
2. Confirmation dialog is shown.
3. Operator confirms; `PATCH /api/rentals/{id}` is called with status `CANCELLED`.
4. On success: `draftRental` is set to `null`; card is removed from the dashboard.

**Unhappy path — discard API fails:**

1. PATCH returns an error.
2. Snackbar error notification is shown; `draftRental` signal is unchanged; card remains.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is logged; only the rental ID is emitted to the logger on discard success or failure.
* **Scale & Performance:** A single GET on component init with `size=1` minimises payload size. No polling occurs; the draft state is valid only for the current dashboard visit. The confirmation dialog prevents accidental discard of the draft.
