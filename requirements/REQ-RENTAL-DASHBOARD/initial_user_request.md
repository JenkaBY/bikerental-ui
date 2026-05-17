# Initial User Request — Rental Dashboard Feature

## Original Request

Implement the Rental Dashboard feature for the Operator SPA. This feature
provides operators with a real-time overview of active rentals and a
filterable view of today's closed/draft rentals, plus full rental detail
and return flow from the same screen.

---

## Adjustments Agreed During Clarification

- **FR-02 & FR-04**: No "+ New Rental" button on the dashboard top bar.
- **FR-01**: The new `RentalListStore` is a shared, feature-scoped store;
  `RentalDashboardMapper` is the pure-static mapper consumed by that store.
  The return-payload type is named `ReturnEquipmentWrite` (not `ReturnEquipmentRequest`).
- **FR-10**: Reuses the existing `app-rental-pricing-section` component
  (`RentalPricingSectionComponent`) from the Create Rental flow; the detail
  store must expose a compatible interface for that component's injected tokens.

---

## Screens Covered

| Screen                                 | Route                            | Description                                                           |
|----------------------------------------|----------------------------------|-----------------------------------------------------------------------|
| Rental Dashboard — Active tab          | `/rentals` (default)             | Scrollable list of all active rentals, sorted by expected return time |
| Rental Dashboard — Today's History tab | `/rentals?tab=history`           | Filterable list of today's completed/debt/cancelled/draft rentals     |
| Rental Detail — Active                 | `/rentals/:id`                   | Full detail, pricing controls, equipment selection, action buttons    |
| Rental Detail — Debt                   | `/rentals/:id` (status=DEBT)     | Same route, read-only cost, top-up primary action, no return buttons  |
| Broken Equipment Dialog                | Bottom sheet over `/rentals/:id` | Mark equipment as broken with optional penalty amount                 |

---

## Technical Answers

| Question                   | Answer                                                                                                              |
|----------------------------|---------------------------------------------------------------------------------------------------------------------|
| Current cost source        | Via `/api/tariffs/calculate` endpoint; uses `costCalculationStore.costEstimate()` — same mechanism as Create Rental |
| Today's history date range | `GET /api/rentals?from={date}T00:00&to={date}T23:59` using local calendar day                                       |
| Filter persistence         | URL query parameter (`?filter=ALL\|COMPLETED\|DEBT\|CANCELLED\|DRAFT`)                                              |
| Debt vs Active routing     | Same `/rentals/:id` route; component adapts rendering based on `rental.status`                                      |

---

## Out of Scope

- Authentication and authorization
- Creating or editing rental parameters after rental has started
  (discount and special price at return time are the only exception)
- Equipment repair workflow beyond marking as broken
- Pagination or date range filtering in the history tab
- Push notifications for overdue rentals
