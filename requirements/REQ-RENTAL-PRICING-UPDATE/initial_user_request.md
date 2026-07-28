# Original request

On the backend (bike-rental, branch `feature/patch-discount-for-active-rental`) a new endpoint
appeared:

```
PATCH /api/rentals/{rentalId}/pricing
```

It lets an operator set, change, or clear a discount / special price on an already **ACTIVE**
rental (previously this was only possible while the rental was in `DRAFT`). Wire up the frontend
integration. First find how the sibling endpoint `POST /api/rentals/{rentalId}/equipments`
(adding equipment to an active rental) is already implemented — same mechanics ("mutate an active
rental → get back the full rental with a recalculated cost"), and the new feature should live on
the same screen/flow that already shows and edits the active rental.

## Endpoint contract

Request body (`RentalPricingRequest`) is a **full replacement** of the pricing block, not a patch
of individual fields:

```json
{
  "specialTariffId": 99,
  "specialPrice": "15.00",
  "discountPercent": 10,
  "operatorId": "operator-1"
}
```

A field absent from the body (or sent as `null`) **clears** the corresponding override on the
backend. This is not JSON-Merge-Patch semantics — it's "send what should remain, everything else
is reset." The frontend form/state must always send the full current pricing state, not just the
changed field.

Rules (validated server-side; duplicate in the UI before submitting):
- `specialTariffId` and `specialPrice` — either both set or both absent.
- `specialTariffId`/`specialPrice` and `discountPercent` — mutually exclusive.
- `discountPercent` — integer 0–100.
- `specialPrice` — >= 0.
- `specialTariffId` — positive, and must reference a tariff of type `SPECIAL` (otherwise 422).

Response (200) is the same `RentalResponse` returned by the other rental command endpoints
(create/add-equipment/lifecycle), including:
- `estimatedCost` — recalculated total.
- `specialTariffId` — new field on the response; tells you which special tariff the price is
  currently pinned to.
- `specialPrice`, `discountPercent` — current override values.
- `equipmentItems[].estimatedCost` — per-item cost; already-`RETURNED` items keep their frozen
  final cost and are not recalculated — only not-yet-returned items are.

## Call conditions / error codes

- Rental must be `ACTIVE`. Otherwise 422, `errorCode = "rental.status.invalid"`.
- Unlike add-equipment, this endpoint does **not** check `now < expectedReturnAt` — an overdue
  active rental can still be repriced. Don't gate the button on "rental is overdue".
- Rental not found — 404, `errorCode = "shared.resource.not_found"`.
- `specialTariffId` references a tariff that isn't `SPECIAL` type — 422,
  `errorCode = "tariff.special.type_invalid"`.
- Request-body validation errors — 400, `errorCode = "shared.request.validation_failed"`, an
  `errors[]` array of `{field, code, params}` per violated field. `validation.special_tariff_consistency`
  and `validation.special_tariff_and_discount_exclusive` are class-level errors — `field = null` —
  render as a general form message, not bound to a specific input.
- No money moves on this call — it's a re-estimate, not a return-time settlement.

## What to build

1. On the active-rental screen, right of "Current cost", add a **Change price** button. Clicking
   it opens a bottom sheet to update pricing via the PATCH endpoint. The sheet contains the same
   segmented tab group used to set price mode as on the create/draft screen, plus **Close** and
   **Update** buttons. Close, and a tap outside the sheet, both dismiss it. Update sends the
   request; on success it closes the sheet and refreshes the active-rental screen (or just the
   necessary fields).
2. The API client is already regenerated from the backend's OpenAPI spec — `RentalPricingRequest`
   and the updated `RentalResponse` (with `specialTariffId`) should already be present.
3. Add a UI block on the active-rental screen to set/change a discount **or** a special price
   (mutually exclusive choice in the form — a toggle/segmented control, not two independent
   fields, so the user physically cannot submit both), plus a way to clear the discount/special
   price that sends a request with empty pricing fields. (See point 1.)
4. Handle the error codes above (403/422/400) with clear user-facing messages.
5. On a successful response, update the on-screen rental state from the response in full
   (`estimatedCost`, `specialTariffId`, `specialPrice`, `discountPercent`, `equipmentItems`),
   the same way this is already done after add-equipment.

## Follow-up refinement (after initial plan review)

Instead of a separate "Change price" button, the price-mode badge itself (already shown next to
"Current cost") became the entry point:
- Move the discount/fixed-price badge into the "Current cost" row.
- Make it interactive (tappable) on an active rental, non-interactive (plain, read-only) on any
  other rental status.
- When no override is active, show a `+ Change price` badge/button in its place.
- Every interactive badge ends with a `›` chevron to signal it's tappable.

## Decisions made during planning

- The bottom sheet computes its own live price preview while the operator edits (own debounced
  cost-calculation request), so the screen behind the sheet does not change until Update succeeds.
- On a partially-returned rental, `specialPrice` is a fixed total for the **whole** rental
  (frozen returned items included), not just the remaining unreturned items.
