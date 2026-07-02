# Prompt for the frontend agent

Paste everything below into a Claude Code (or similar) session running in the **frontend repo** (the Operator
app — `bike-rental-operator`, origin `http://localhost:4202`). This is a separate repo from the backend; the agent
receiving this prompt has no memory of how the backend feature was built, so the prompt is self-contained.

---

## Task

The BikeRental backend now supports adding equipment to an **already-active** rental. Implement the UI for this in
the **Operator app** (not the admin console — this is an operational, day-to-day action staff perform at the
counter). Business context: a customer picks up an extra item (e.g. a helmet) partway through a rental they already
started; the operator needs to add it to the existing rental instead of creating a second one.

Before writing any code, **explore this repo** to find:
1. The existing "return rented equipment" screen/flow (it already exists and is the closest analog — same rental,
   same operator context, same general shape of "pick equipment, submit, see updated rental").
2. How the generated API client is produced/regenerated (this backend serves OpenAPI via springdoc; there should be
   a script or config pointing at `{backend-base-url}/v3/api-docs` or a checked-in spec file). Regenerate the client
   against the running backend (or a fresh `/v3/api-docs.yaml` export) rather than hand-writing request/response
   types, if that tooling exists.
3. The rental detail view/component that shows an ACTIVE rental (equipment list, estimated cost, expected return
   time) — the new action should live there.

Mirror those existing patterns (component structure, state management, error-toast conventions, i18n key naming)
rather than introducing a new pattern for this one feature.

## New endpoint contract

```
POST /api/rentals/{rentalId}/equipments
Content-Type: application/json
Authorization: Bearer <access token>   (OPERATOR role required — same as the rest of /api/rentals/**)
```

**Path parameter:** `rentalId` — positive integer.

**Request body:**
```json
{
  "equipmentIds": [12, 34],
  "operatorId": "op-jane"
}
```
- `equipmentIds` — required, non-empty array of positive integers. IDs of equipment already known to be available
  (see "Equipment picker" below) — do not let the user free-type IDs.
- `operatorId` — required, non-blank string. Same operator identifier already used elsewhere in this app (e.g. the
  logged-in user's id/username) — reuse whatever the "return equipment" flow passes for this field, don't introduce
  a new source for it.

**Success — 200 OK:** returns the full updated rental (same shape as every other rental-returning endpoint in this
API — reuse your existing `RentalResponse` model/type if the client already has one):

```json
{
  "id": 30,
  "customerId": "c9f6b1de-...",
  "status": "ACTIVE",
  "startedAt": "2026-02-10T08:00:00Z",
  "expectedReturnAt": "2026-02-10T10:00:00Z",
  "actualReturnAt": null,
  "plannedDurationMinutes": 120,
  "actualDurationMinutes": null,
  "estimatedCost": 17.00,
  "specialPrice": null,
  "discountPercent": null,
  "finalCost": null,
  "equipmentItems": [
    { "equipmentId": 1, "equipmentUid": "BIKE-001", "status": "ACTIVE", "estimatedCost": 16.00, "finalCost": null, "tariffId": 1, "actualReturnAt": null, "breakdown": null },
    { "equipmentId": 2, "equipmentUid": "HELMET-001", "status": "ACTIVE", "estimatedCost": 1.00, "finalCost": null, "tariffId": 4, "actualReturnAt": null, "breakdown": null }
  ]
}
```
Refresh/replace whatever rental view state the "return equipment" flow already refreshes on its own success — this
endpoint's response is the complete, current rental, so a straight replace is correct.

**Important product behavior to reflect in the UI (don't just show a generic error for these — see the copy
guidance below):**
- The newly added item is priced only for the **remaining time** until the rental's existing `expectedReturnAt` — it
  does **not** extend the rental's return deadline. Consider showing something like "billed until {expectedReturnAt},
  same as the rest of this rental" near the picker so operators aren't surprised the window doesn't change.
- **No payment is taken when adding.** The estimate (`estimatedCost`) goes up; money only moves at return, same as
  today's overtime billing. If your UI shows "amount charged" anywhere in this flow, make sure it's not implied to
  be captured immediately.

## Error responses

All errors are RFC 9457 `application/problem+json` with two custom fields your error-toast/handler presumably
already reads: `correlationId` and `errorCode`. Map on `errorCode`, never on `detail` (that's free text, not stable).

| HTTP | errorCode | Meaning | Suggested UI handling |
|---|---|---|---|
| 400 | `shared.method_arguments.validation_failed` | Empty `equipmentIds`, blank `operatorId`, etc. | Should be prevented client-side by disabling submit; if it still happens, surface `errors[].field` / `errors[].code` same as your other forms. |
| 404 | `shared.resource.not_found` | Rental itself doesn't exist. | Shouldn't happen from the UI (you're already on the rental's page) — treat as an unexpected-error toast. |
| 422 | `shared.reference.not_found` | One of the submitted `equipmentIds` doesn't exist. | Shouldn't happen if the picker only offers valid IDs — treat as unexpected-error toast. |
| 422 | `shared.equipment.not_available` | Equipment exists but is out of service (broken/maintenance). `params.unavailableIds` (or similar — check the exact field name in the live response) lists the offending IDs. | Should be prevented by only listing in-service equipment in the picker (see below); if hit anyway, show "This equipment is out of service" and remove it from the picker. |
| 409 | `rental.equipment.not_available` | Equipment exists and is in service, but is currently occupied by another rental. `params.unavailableIds` lists them. | Show "Already rented — pick something else" and refresh the picker's available list. |
| 422 | `rental.status.invalid` | The rental is no longer ACTIVE (raced with a return/cancel in another tab, etc). `params` = `{currentStatus, expectedStatus}`. | Show "This rental is no longer active" and refresh/redirect to the rental's current state. |
| 422 | `rental.window.elapsed` | The rental's `expectedReturnAt` has already passed — there's no billable window left to add equipment into. `params` = `{rentalId, expectedReturnAt, now}`. | Show something like "This rental is overdue — return it or extend it before adding equipment" (there's no "extend" action today; word it as guidance to return soon). This is a real, expected business state, not a bug — don't present it as a generic error. |

Full catalogue entry (with exact JSON shape) is `docs/error-codes.md` in the backend repo under `rental.window.elapsed`
and `rental.equipment.not_available` if you have access to that repo; otherwise the table above is complete.

## Equipment picker

Reuse the **existing** endpoint (already used elsewhere in this app for building a new rental — find that call site
and copy its pattern):

```
GET /api/rentals/available-equipments?q={search text}&page={n}&size={n}
```
Returns a page of:
```json
{ "id": 5, "uid": "BIKE-005", "serialNumber": "SN-ABC-005", "typeSlug": "mountain-bike", "model": "Trek Marlin 5" }
```
This already excludes equipment that's out of service or occupied by another rental — it's the same list "create
rental" uses to offer equipment, so the picker for "add to rental" should look and behave identically (search box,
same result card/row layout, multi-select). Don't build a second, different picker component for this — parameterize
the existing one if it's currently hard-coded to a "new rental" context.

## Where this lives in the UI

Add an "Add equipment" action on the active-rental detail view, next to (or in the same area as) the existing
"Return equipment" action. Gate it the same way the existing rental actions are gated (only when
`status === 'ACTIVE'`; there's no separate permission for this beyond the existing OPERATOR role check already
applied to the rest of `/api/rentals/**`).

Suggested flow:
1. Operator clicks "Add equipment" on an ACTIVE rental.
2. A picker (as above) opens, search + multi-select equipment not already on this rental.
3. Submit calls `POST /api/rentals/{rentalId}/equipments` with the selected IDs and the current operator id.
4. On success, close the picker and refresh the rental view from the response — new items show up in the equipment
   list immediately with their own `estimatedCost` and status `ACTIVE`.
5. On error, use the table above to decide the message; for the two "shouldn't happen" rows, whatever generic
   API-error handling this app already has is fine.

## Testing expectations

Match whatever this frontend repo's existing test convention is for a form + list interaction (e.g. if "return
equipment" has component/e2e tests, add equivalents for "add equipment": happy path with 2 selected items, occupied
equipment rejected with 409, window-elapsed rejected with 422). Don't invent a new testing pattern — copy the
closest existing one.

## Explicitly out of scope (don't build these)

- Any UI for extending a rental's `expectedReturnAt` — that action doesn't exist on the backend yet.
- Any "pay now" / immediate-charge UI for the added item — money only moves at return, by design.
- Editing/removing an item that was already added (no such endpoint exists yet; only add + the existing return flow).
