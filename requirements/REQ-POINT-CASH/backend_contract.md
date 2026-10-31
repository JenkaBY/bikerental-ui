# Backend contract for REQ-POINT-CASH

Source: answers from the backend (`JenkaBY/bike-rental`) on https://github.com/JenkaBY/bike-rental/issues/321#issuecomment-6545515428 (2026-10-31). **The backend model (FIN-002) drives**; UI requirements and designs follow it.


**Decision: the backend model (FIN-002) drives.** The UI's single "bank transfer" maps onto the operations that
FIN-002 already defines. **There is no collection cancellation**, and responses carry **user ids, not names**: the
admin app resolves names from `GET /api/auth/users` (ADMIN), and the endpoints operators call return only the
operator's own data.

| UI proposal | Backend contract | State |
| --- | --- | --- |
| `POST /bank-transfers {CASH}` | `POST /api/finance/collections` `{idempotencyKey, amount}` → 201 `{transactionId, pointSlug, amount, cashPosition, recordedAt}`, OPERATOR + ADMIN, `X-Point-Slug` | **in main** (FR-05) |
| `POST /bank-transfers {CARD_TERMINAL}` | `POST /api/finance/terminal-settlements`, **ADMIN only**, `X-Point-Slug`, with the settlement date from the bank statement | FR-06, to be built |
| `snapshot?date` | `GET /api/finance/shifts/current` → `{shiftId, pointSlug, sequence, openedAt, openingAmount, movements[{type, amount}], expectedCash}`; close: `POST /api/finance/shifts/current/closures` `{idempotencyKey, shiftId, countedAmount}` | **in main** (FR-07) |
| `point-accounts/balances` | `GET /api/finance/point-positions` (ADMIN): every point incl. closed, positions CASH / CARD_TERMINAL / BANK / REVENUE / CORRECTIONS, totals per kind | FR-08, to be built |
| `point-accounts/movements` | `GET /api/finance/point-movements?pointSlug&position&from&to&page&size` (ADMIN): `{transactionId, recordedAt, kind, amount (signed), runningBalance, recordedBy (user id), customerId?, rentalId?, shiftId?}` | FR-08, to be built |
| `bank-transfers` list / `summary` | collections and settlements are `point-movements` rows of kind `COLLECTION` / `TERMINAL_SETTLEMENT`; period totals come with `GET /api/finance/point-results?from&to[&pointSlug]` | FR-08, to be built |
| `bank-transfers/{id}/cancellation` | **not provided** — a wrong collection is corrected with an adjustment | — |

1. **No, not as proposed.** Paths and fields as in the table. Also:
   - the error code is in the ProblemDetail property **`errorCode`**, not `code` (see `docs/error-codes.md`);
   - "today" is the **running shift**, not a calendar day: the opening amount is the count at the previous shift's close;
   - operators see only the running shift of their point; the till, terminal, bank and movement views are ADMIN-only (FR-08).
2. **Point-specific codes, no `params.available`:**
   - `422 finance.point.insufficient_cash`, `params {pointSlug, cashPosition, amount}` (in main);
   - `422 finance.point.insufficient_terminal`, `params {pointSlug, cardTerminalPosition, amount}` (FR-06).
3. **Movement kinds:** `DEPOSIT`, `WITHDRAWAL`, `CAPTURE` (rental payment), `PENALTY`, `ADJUSTMENT`, `COLLECTION`,
   `TERMINAL_SETTLEMENT`, `SHIFT_DISCREPANCY`. "Transfer cancelled" does not exist. The movements view is always paged:
   `size` ≤ 100, no unpaged mode; sort only by `recordedAt` (asc|desc), because the running balance is chronological.
   The period is required and at most 366 days.
4. **No header.** Like deposits, withdrawals and collections, the request body carries a mandatory UUID
   `idempotencyKey`; a repeated request returns the first result.
5. **Not applicable** — there is no cancellation.
6. **Yes, a real ledger move** (card-terminal position → bank position of the same point), but a separate operation:
   ADMIN only, at the point they work at, with the settlement date. Refused only at a `PERMANENTLY_CLOSED` point
   (`422 finance.point.permanently_closed`); operators cannot record it.
7. **Yes for the current state.** A point has only its current status, so a closure made earlier today is visible
   at once. There is no status history: a past date shows today's status. FR-08 will put the point status into
   `point-positions`.

Fields of the FR-06 and FR-08 endpoints are final only once they appear in `/v3/api-docs/all`.

