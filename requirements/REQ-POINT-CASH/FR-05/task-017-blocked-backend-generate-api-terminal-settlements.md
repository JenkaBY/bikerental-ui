# Task 017: [DONE] Regenerate the API client for terminal settlements

> **Applied Skill:** AGENTS.md "Three-Layer Data Pipeline" - `npm run generate:api` overwrites `core/api/generated/**`; never edit generated code.

## 0. Status

DONE. `npm run generate:api` ran against the published backend and prettier was applied. The only diff is additive: `projects/shared/src/core/api/generated/models/index.ts` and `projects/shared/src/core/api/generated/services/finance.service.ts`. Do not re-run it and do not hand-edit generated files.

## 1. Recorded contract (used verbatim by tasks 018-020)

* `FinanceService.recordTerminalSettlement(terminalSettlementRequest: TerminalSettlementRequest, observe?, options?)` - `POST /api/finance/terminal-settlements`, 201.
* `TerminalSettlementRequest { idempotencyKey: string; amount: number; statementDate: string }` - `statementDate` is a plain `yyyy-MM-dd` date, not in the future.
* `TerminalSettlementResponse { transactionId: string; pointSlug: string; amount: number; statementDate: string; cardTerminalPosition: number; recordedAt: string }` - `cardTerminalPosition` is required (position after the settlement).
* Errors: 400 validation; 403 admin only; 409 no working point (`X-Point-Slug` missing); 422 `finance.point.permanently_closed` or `finance.point.insufficient_terminal` (`params.cardTerminalPosition`). Both codes are already registered in `core/errors/error-code.ts` / `error-messages.ts` and handled by `PointMoneyErrorClassifier`.

## 2. Validation Steps

Nothing to execute for this task. Mark it done in the checklist.
