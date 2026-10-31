# Initial User Request — Point Cash & Bank Transfers

## Original Request (Russian, paraphrased)

> Продумать, как встроить функциональность снятия денег из кассы и перевода их на банковский счёт.
> Возможно, нужна новая страница в админке для управления финансами по точкам, наподобие страницы
> клиентов. Дизайн должен быть консистентным с существующим. Также оператор должен иметь
> возможность сдавать наличку из своего приложения.

**English summary:** Work out how to add the ability to take money out of a rental point's cash
drawer and transfer it to the business bank account. A new admin page for managing finances per
rental point is likely needed, similar to the Customers page. The design must be consistent with
the existing UI. Operators must also be able to hand in cash (transfer it to the bank) from the
operator app.

## Agreed Design (approved by the product owner in design review)

Design canvas (reference only): https://claude.ai/artifact/5R4AjZNqpfnASfsAMQd97b

### Money model

- Each rental point has two money accounts of its own: **CASH** (cash drawer) and
  **CARD_TERMINAL** (card terminal account). Each has a per-point balance.
- A "transfer to bank" moves an amount from one of these point accounts to the business's bank
  account. The destination is constant and has no name or label — it is simply "the bank account".
  The user never chooses it.
- Transfers are instant: no "in transit" status, no bank-credit confirmation, no discrepancy
  handling.
- Transfers are allowed only from **active** points (see Decisions).
- No cash limits (explicitly out of scope).
- A transfer history entry has status **Проведено** (completed) or **Отменено** (cancelled —
  reversed by an admin; the money returns to the source account).

### Admin app (desktop)

1. Points list (`/points`) becomes a table like the customers list: columns Точка (name + slug),
   Статус, Наличные в кассе, Терминал, Последняя инкассация (date · who); a row opens the point
   detail. Above the table: summary cards "Наличные во всех кассах", "На счетах терминалов",
   "Зачислено в банк за <месяц>" (sum + count). Permanently closed points are hidden by default;
   a checkbox "Показывать закрытые точки" shows them, with a "Скрыто закрытых: N" counter.
   Temporarily closed points stay visible.
2. Point detail page `/points/:slug` mirrors the customer detail page: page header (back, point
   name, status pill, address/slug, balance pills "Касса …" and "Терминал …") + segmented tabs:
   Профиль (existing point edit form moves here), Касса, Инкассации, Операции.
3. Tab Касса: cash card (balance, breakdown: на начало дня / принято наличными / выдано наличными /
   сдано в банк, "Сдать в банк" button), terminal account card (balance + "Перевести в банк"), and
   today's cash movement list (time, type, customer · operator, signed amount, running balance).
4. Tab Инкассации: paged history of transfers for the point — filter chips Все / Проведено /
   Отменено + date range; columns Дата (+ who), Сумма, Источник (Касса / Терминал), Статус, row
   actions menu (cancel). Also a "Сдать в банк" button.
5. Transfer dialog "Перевести в банк": shows point + source (касса or терминал, determined by the
   button that opened it), the destination as the generic "Банковский счёт", available balance.
   Only one input: amount (required, > 0, ≤ available), with an "Всё" shortcut and an
   "Останется: X" hint. Submit opens a confirmation dialog "Перевести в банк?" (amount, Откуда,
   Куда, Останется) with Назад / Перевести; only then the transfer executes.

### Operator app (mobile, max-width 480, bottom nav)

6. New 4th bottom-nav item "Касса" (point_of_sale icon) next to Аренды / Новая / Возврат. Screen
   shows the current working point's money (point chosen in the toolbar switcher): cash balance
   card with primary "Сдать в банк", terminal account card with "Перевести в банк", today's
   movements on both accounts.
7. Transfer screen "Сдать в банк" (full screen, back arrow, bottom nav hidden): source tabs
   Касса / Терминал with balances, large amount input, "Всё" shortcut, Останется + destination
   ("Банковский счёт"), primary "Перевести X BYN".
8. Confirmation dialog "Перевести в банк?" (amount, откуда, куда, останется, note that the transfer
   is instant and only an admin can cancel it) → Отмена / Перевести.
9. Success screen "Переведено в банк": amount, source, destination, time, remaining balance,
   "Готово" back to Касса.

- All operators may transfer (no extra role check). Operators cannot cancel transfers.

## Constraints

- The backend does not yet expose per-point CASH / CARD_TERMINAL balances, a bank-transfer
  operation, transfer history, or cancellation. These are backend dependencies. The existing API
  uses ledger types CASH, CARD_TERMINAL, BANK_TRANSFER and payment methods CASH | CARD_TERMINAL |
  BANK_TRANSFER; the terminal account in this feature is the CARD_TERMINAL ledger.
- All visible text is localized (English source + Russian); errors follow the project's
  ProblemDetail error-handling conventions.
- Requirements only — no design, code, tests, or commits in this step.

## Decisions (product owner answers to BA open questions)

| # | Question | Decision |
|---|----------|----------|
| 1 | Where does "create point" live? | On the points list; opens the Профиль form in create mode and lands on the new point's detail page. |
| 2 | Where do point status actions go? | Профиль tab, together with the edit form. |
| 3 | What is the Операции tab? | Paged list of all movements on both point accounts (CASH and CARD_TERMINAL), with a date-range filter. |
| 4 | Transfers from closed points? | **Forbidden** for both temporarily closed and permanently closed points — money is taken out before a point is closed. Transfer buttons are disabled with a localized explanation; the transfer flows must not execute for a non-active point and must handle a backend refusal. |
| 5 | Do operators see terminal movements? | Yes — the operator Касса screen lists today's movements of both CASH and CARD_TERMINAL, each marked with its account. The admin Касса tab list stays cash-only. |
| 6 | Confirmation / reason when cancelling a transfer? | Neither. Choosing "Cancel transfer" in the row menu cancels immediately; it is irreversible, records who/when, and still handles "already cancelled". |
| 7 | Bank account label? | None. The destination is shown only as generic localized "Банковский счёт / Bank account" text. The "Счёт зачисления" history column is dropped; the history shows the source account (Касса / Терминал) instead. |
| 8 | Terminal ledger name? | CARD_TERMINAL (as in the backend/generated API). Per-point CASH / CARD_TERMINAL balances remain a backend dependency. |
| 9 | Which clock defines "today" / "this month"? | The app's business clock. |

## Requirement Breakdown

| FR    | Title                                                       | App      |
|-------|-------------------------------------------------------------|----------|
| FR-01 | Points list with money overview                             | Admin    |
| FR-02 | Point detail shell and Профиль tab                          | Admin    |
| FR-03 | Касса tab — point balances and today's cash movements       | Admin    |
| FR-04 | Инкассации tab — transfer history and cancellation          | Admin    |
| FR-05 | Transfer-to-bank dialog with confirmation                   | Admin    |
| FR-06 | Operator Касса screen and bottom-nav entry                  | Operator |
| FR-07 | Operator transfer flow — form, confirmation, success screen | Operator |
