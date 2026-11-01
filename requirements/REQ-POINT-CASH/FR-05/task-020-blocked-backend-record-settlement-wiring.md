# Task 020: [BLOCKED - needs task 019] Enable "Record settlement" on the Cash tab

> **Applied Skill:** `angular-component`, `angular-signals` (existing `settlement` availability computed), AGENTS.md i18n Rules (new message function + Russian target in the same change), CLAUDE.md "Keep docs in sync".

## 1. Objective

Replace the interim `onSettle` handler, add the "Settlement recorded: X" success toast to the launcher, translate it.

Requires tasks 013, 014, 019.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts` - **Action:** Modify Existing File
* **File Path:** `projects/admin/src/app/points/point-money-move.launcher.ts` - **Action:** Modify Existing File
* **File Path:** `projects/admin/src/app/points/point-cash-tab.component.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/locale/messages.xlf` / `messages.ru.xlf`, `overview.md`

## 3. Code Implementation

**File 1 - append to `point-money-messages.ts`:**

```typescript
export function pointSettlementRecordedMessage(amount: string): string {
  return $localize`Settlement recorded: ${amount}:amount:`;
}
```

**File 2 - launcher.** Import `pointSettlementRecordedMessage`; replace the `tap` body with:

```typescript
        tap((result) => {
          if (result?.outcome !== 'done') return;
          const amount = formatFixedMoney(result.amount, this.locale);
          this.notifications.success(
            result.operation === 'SETTLEMENT'
              ? pointSettlementRecordedMessage(amount)
              : pointCollectedMessage(amount),
          );
        }),
```

**File 3 - cash tab.** Replace the interim `onSettle`:

```typescript
  protected onSettle(): void {
    const point = this.points.selected();
    const available = this.positions.cardTerminal();
    if (!point || !available) return;
    this.moves
      .open(this.injector, {
        operation: 'SETTLEMENT',
        pointSlug: point.slug,
        pointName: point.name,
        available,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onMoveClosed(result));
  }
```

`onCloseShift` keeps the interim handler (FR-08); `Labels` and `notifications` stay imported because it still uses them.

**File 4 - i18n.** Run `npm run i18n:extract`; add to `messages.ru.xlf` (before `</body>`) one new unit, copying id and `<source>` verbatim from `messages.xlf`: source `Settlement recorded: <x id="amount" .../>` -> target `Зачисление записано: <x id="amount" .../>`. Do NOT change any existing unit. Run `npm run i18n:check`.

**File 5 - overview.md.** In the `PointFinanceService` block add the bullet "`recordSettlement(write, pointSlug)` over `POST /api/finance/terminal-settlements` (ADMIN only)"; in `PointFinanceMapper` the `settlementToRequest` / `settlementFromResponse` bullet; in `PointCashTabComponent` mention `onSettle()` opens the SETTLEMENT dialog (available = CARD_TERMINAL); in `PointMoneyMoveDialogComponent` replace "terminal settlement mode follows" with the settlement date field description (`PointSettlementDateFieldComponent`, max today, `notFutureDateValidator`).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/point-money-messages.ts projects/admin/src/app/points/point-money-move.launcher.ts projects/admin/src/app/points/point-cash-tab.component.ts overview.md
npm run i18n:extract
npm run i18n:check
npx ng build admin --configuration development
npx ng lint admin
```
