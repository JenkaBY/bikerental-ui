# Task 005: Register finance.point.insufficient_cash / insufficient_terminal

> **Applied Skill:** `error-handling` and AGENTS.md "API Error Handling" - every new backend code is registered in `core/errors/error-code.ts` + `core/errors/error-messages.ts` with a `$localize` template; the resolver's status fallback is not a substitute.

## 1. Objective

Register the two refusal codes with localized copy. `insufficient_terminal` belongs to the not-yet-published settlement endpoint, but it is only a string, so it is registered now. The copy reads the current position from `params` (`cashPosition` / `cardTerminalPosition`).

The existing copy of `finance.point.inactive` / `finance.point.permanently_closed` ("... cannot receive or pay out money ...") is shared with the customer deposit / withdraw flow and already reads correctly for collection and settlement, so it is **left unchanged** (changing it would also rewrite those flows' Russian units). The collection dialog shows `Labels.PointCollectionNotActiveHint` for `finance.point.inactive` instead (task 012).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/errors/error-code.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/errors/error-messages.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - `error-code.ts`:**

* In the `ErrorCode` object, directly below `FINANCE_POINT_PERMANENTLY_CLOSED: 'finance.point.permanently_closed',` add:

```typescript
  FINANCE_POINT_INSUFFICIENT_CASH: 'finance.point.insufficient_cash',
  FINANCE_POINT_INSUFFICIENT_TERMINAL: 'finance.point.insufficient_terminal',
```

* In the `DOMAIN_CODES` set, directly below `ErrorCode.FINANCE_POINT_PERMANENTLY_CLOSED,` add:

```typescript
  ErrorCode.FINANCE_POINT_INSUFFICIENT_CASH,
  ErrorCode.FINANCE_POINT_INSUFFICIENT_TERMINAL,
```

**File 2 - `error-messages.ts`:**

* In the `ErrorMessageCatalog` `// Finance` block, directly below `[ErrorCode.FINANCE_POINT_PERMANENTLY_CLOSED]: financePointPermanentlyClosedMessage,` add:

```typescript
  [ErrorCode.FINANCE_POINT_INSUFFICIENT_CASH]: financePointInsufficientCashMessage,
  [ErrorCode.FINANCE_POINT_INSUFFICIENT_TERMINAL]: financePointInsufficientTerminalMessage,
```

* Directly after the `financePointPermanentlyClosedMessage` function (before `function insufficientFundsMessage`) add:

```typescript
function financePointInsufficientCashMessage(params: Record<string, unknown>): string {
  const available = params['cashPosition'];
  if (typeof available === 'number') {
    return $localize`Not enough cash in the drawer. Available: ${available.toFixed(2)}:available:.`;
  }
  return $localize`There is not enough cash in the drawer for this amount.`;
}

function financePointInsufficientTerminalMessage(params: Record<string, unknown>): string {
  const available = params['cardTerminalPosition'];
  if (typeof available === 'number') {
    return $localize`Not enough funds on the terminal account. Available: ${available.toFixed(2)}:available:.`;
  }
  return $localize`There is not enough money on the terminal account for this amount.`;
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/errors/error-code.ts projects/shared/src/core/errors/error-messages.ts
npx ng build admin --configuration development
```
