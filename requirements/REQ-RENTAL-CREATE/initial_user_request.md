# Initial User Request — Create Rental Feature

## Original Request

Implement the "Create Rental" feature for the frontend of an internal
bike rental management application.

### Feature Overview

A standalone multi-step flow accessible via route `/rentals/new`.
The flow allows an operator to create a rental for a customer through
three sequential steps: customer selection, rental parameters, and
confirmation.

### Step 1 — Customer Selection

The operator searches for a customer by phone number. Results appear
in a dynamic dropdown as the operator types. If the customer is not
found, the operator can create a new one directly from the dropdown.
After selecting or creating a customer, the flow proceeds to Step 2.

Creating a new customer requires only a phone number (mandatory).
First name and last name are optional. The phone number is pre-filled
from the search query.

### Step 2 — Rental Parameters (Draft)

The operator configures the rental. This step auto-saves as a draft.
The operator can explicitly save a draft and return later.

#### Customer context

The selected customer is displayed at the top with their available
balance. The operator can top up the customer's balance directly from
this step without leaving the flow.

#### Duration

The operator sets the rental duration, which applies to all equipment
in the rental. Duration is controlled via a slider with fixed snap
points and a synchronized numeric input field. The minimum duration
is 30 minutes, the maximum is 2 days. All duration controls are
always in sync.

#### Equipment

The operator adds one or more equipment items to the rental. Equipment
is selected from a searchable catalog. Items can be removed individually.
A rental must have at least one equipment item to proceed.

#### Pricing

The total price is calculated dynamically via an API call whenever
duration, equipment, or pricing options change.

By default, the operator can apply a percentage discount. Alternatively,
the operator can enable a "special price" mode and set a fixed price
for the entire rental. When special price mode is active, the discount
option is hidden. The special price field is mandatory when this mode
is enabled — the flow is blocked until a value is entered.

The total cost and the customer's projected balance after payment are
always visible at the bottom of the screen. If the balance is
insufficient, the operator is clearly notified and cannot proceed until
the balance is topped up.

### Step 3 — Confirmation

A read-only summary of all rental parameters: customer, duration,
equipment list, applied discount or special price, and total cost.
The projected balance after payment is shown.

If the balance is sufficient, the operator starts the rental with a
single "Start Rental" action. If the balance is insufficient, the
operator can top up directly from this screen.

After a successful start, the operator is redirected to the dashboard.

### Key Business Rules

- A rental cannot start if the customer's available balance is less
  than the total cost.
- The special price field is mandatory when special price mode is
  enabled — saving draft and proceeding are both blocked until filled.
- Duration applies uniformly to all equipment items in the rental.
- A rental must contain at least one equipment item.
- Equipment items can be partially returned after the rental starts —
  this is handled outside this flow.
- Draft is saved automatically when the operator proceeds from Step 2
  to Step 3.
- The operator can navigate back between steps without losing data.
- A customer can be created mid-flow with phone number only.

### Out of Scope

- Authentication and authorization
- Returning equipment
- Editing or cancelling a rental after it has started
- Customer self-service

## Clarifications (collected during BA session, 2026-05-07)

- **Route**: Use `rentals/new` (plural) — update the existing stub and bottom nav link.
- **Draft resumption**: Dashboard shows a "Resume Draft" card if an operator-owned DRAFT rental exists.
- **Post-success redirect**: Navigate to dashboard after successful rental start (customer detail page is a separate feature).
- **Balance top-up UX**: MatDialog modal with amount and payment method fields.
- **Special tariff resolution**: Retrieved via the first equipment type where `isForSpecialTariff = true`, then fetch the active SPECIAL tariff for that equipment type from `/api/tariffs/active?equipmentType={slug}`. The `specialTariffId` sent to the API is auto-resolved; the operator only enters the fixed price amount.
- **Equipment search**: Searchable dropdown by UID and model name; QR scan is out of scope (placeholder button only).
