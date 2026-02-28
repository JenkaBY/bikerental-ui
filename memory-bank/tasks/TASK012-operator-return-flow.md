# TASK012 - Operator: Equipment Return Flow (Mobile, QR Scan)

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK004, TASK011 (for shared QR scanner component)  
**Blocks:** None

## Original Request

Build the equipment return flow for the operator. Opens QR scanner immediately on entry. After scanning a UID,
fetches the active rental for that equipment, shows a cost breakdown (actual time, overtime, forgiveness), collects
additional payment if needed, and confirms the return.

## Thought Process

The return flow is a state machine with 4 phases:
1. **scan** — QR scanner (or manual UID input fallback)
2. **review** — cost breakdown display, user reviews the charges
3. **payment** — if additional payment is due, select payment method and confirm
4. **done** — success message with receipt number, "New Return" button

The component manages a `phase` signal that determines which section is visible.

**Key business rules applied at return**:
- Forgiveness: ≤7 minutes overtime is free
- Overtime: >7 minutes rounds to next 10-minute block
- Early return: ≤10 minutes actual duration → full refund message
- The backend handles all calculation — we just display `CostBreakdown` from the response

**API call**: `POST /api/rentals/return` with `ReturnEquipmentRequest`:
- Either `equipmentUid` or `equipmentId` (we use `equipmentUid` from QR scan)
- `paymentMethod` for any additional charge
- `operatorId` from current user

The backend returns `RentalReturnResponse` which includes:
- `rental` — updated rental with final cost
- `cost` — `CostBreakdown` with all calculation details
- `additionalPayment` — amount due (0 if prepayment covers all)
- `paymentInfo` — payment receipt if additional charge was made

**If additional payment = 0**: skip payment phase, go directly to done.
**If additional payment > 0**: show payment method selector, then call return endpoint with payment method.

Actually, re-reading the API: the `ReturnEquipmentRequest` includes `paymentMethod` in the same call.
So we need to know the payment method BEFORE calling the return endpoint. Two approaches:
1. Always ask for payment method first (simple)
2. Call return without payment info to get cost preview, then call again with payment (API may not support this)

**Chosen approach**: Ask for payment method on the review screen (always shown), then send it with the return request.
If `additionalPayment` turns out to be 0, the payment method is ignored by the backend. This keeps the flow simple.

**Error handling**:
- Equipment not found → show error, return to scan phase
- No active rental for equipment → show error, return to scan phase
- Rental not in ACTIVE state → show 422 error message
- Network error → show error snackbar

## Implementation Plan

### 12.1 — Create ReturnComponent (smart)

Replace placeholder at `src/app/features/operator/return/return.component.ts`:

- Standalone, `OnPush`
- Imports: `MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatButtonToggleModule`, `MatSnackBar`,
  `MatProgressSpinnerModule`, `QrScannerComponent`, `CostBreakdownComponent`
- Injects: `RentalService`, `EquipmentService`, `AuthService`, `MatSnackBar`
- Signals:
  - `phase = signal<'scan' | 'review' | 'processing' | 'done'>('scan')`
  - `scannedUid = signal<string | null>(null)`
  - `returnResult = signal<RentalReturnResponse | null>(null)`
  - `paymentMethod = signal<PaymentMethod>('CASH')`
  - `loading = signal(false)`
  - `error = signal<string | null>(null)`

Template (`return.component.html`):
```html
<div class="return-flow">
  @switch (phase()) {
    @case ('scan') {
      <div class="scan-phase">
        @if (scanning()) {
          <app-qr-scanner
            (scanned)="onQrScanned($event)"
            (cancelled)="scanning.set(false)"
          />
        } @else {
          <h2 i18n>Возврат оборудования</h2>
          <button mat-raised-button color="primary" (click)="scanning.set(true)" class="full-width scan-button">
            <mat-icon>qr_code_scanner</mat-icon>
            <span i18n>Сканировать QR-код</span>
          </button>

          <p class="divider" i18n>или введите UID вручную:</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label i18n>UID оборудования</mat-label>
            <input matInput [formControl]="uidInput" (keyup.enter)="processReturn()">
          </mat-form-field>

          <button mat-raised-button (click)="processReturn()" [disabled]="loading()" class="full-width">
            <span i18n>Найти аренду</span>
          </button>

          @if (error()) {
            <p class="error-text">{{ error() }}</p>
          }
        }
      </div>
    }

    @case ('review') {
      <div class="review-phase">
        <h2 i18n>Результат возврата</h2>

        @if (returnResult()) {
          @if (returnResult()!.rental.actualDurationMinutes && returnResult()!.rental.actualDurationMinutes! <= 10) {
            <mat-card class="early-return-card">
              <mat-card-content>
                <mat-icon>info</mat-icon>
                <span i18n>Ранний возврат (менее 10 минут) — полный возврат денег</span>
              </mat-card-content>
            </mat-card>
          }

          <app-cost-breakdown [data]="returnResult()!" />

          @if (returnResult()!.additionalPayment > 0) {
            <mat-card class="payment-card">
              <mat-card-content>
                <p i18n>Доплата: <strong>{{ returnResult()!.additionalPayment }} ₽</strong></p>
              </mat-card-content>
            </mat-card>
          }

          @if (returnResult()!.paymentInfo) {
            <mat-card class="receipt-card">
              <mat-card-content>
                <p i18n>Чек: {{ returnResult()!.paymentInfo!.receiptNumber }}</p>
              </mat-card-content>
            </mat-card>
          }
        }

        <button mat-raised-button color="primary" (click)="startNewReturn()" class="full-width">
          <mat-icon>qr_code_scanner</mat-icon>
          <span i18n>Новый возврат</span>
        </button>
      </div>
    }

    @case ('processing') {
      <div class="processing-phase">
        <mat-spinner diameter="40"></mat-spinner>
        <p i18n>Обработка возврата...</p>
      </div>
    }
  }
</div>
```

**Flow logic**:

Method `onQrScanned(uid: string)`:
1. Set `scannedUid(uid)`, `scanning.set(false)`
2. Call `processReturn()`

Method `processReturn()`:
1. Get UID from `scannedUid()` or `uidInput.value`
2. If empty → show error "Введите UID"
3. Set `phase('processing')`
4. Build `ReturnEquipmentRequest`: `{ equipmentUid: uid, paymentMethod: paymentMethod(), operatorId: currentUser.username }`
5. Call `RentalService.returnEquipment(request)`
6. On success: `returnResult.set(response)`, `phase.set('review')`
7. On error: parse error, `error.set(message)`, `phase.set('scan')`

Actually — we need to let the operator choose payment method BEFORE processing. Update flow:
- After scanning, show a quick payment method selector (scan → review with method selection → process → done)
- OR: default to CASH and let the operator change on the review screen before re-processing

**Simplified approach**: Since the API processes return + payment in one call, we default payment method to CASH
and process immediately after scan. The result screen shows the breakdown. If the operator needs a different
payment method, they can use the "New Return" flow.

This keeps the flow fast: Scan → Processing → Done. One-tap return.

Method `startNewReturn()`:
1. Reset all signals to initial state
2. Set `phase('scan')`

### 12.2 — Create CostBreakdownComponent (dumb)

Create `src/app/features/operator/return/cost-breakdown.component.ts`:

- Standalone, `OnPush`, dumb component
- Input: `data = input.required<RentalReturnResponse>()`
- Displays: actual minutes, billable minutes, planned minutes, overtime minutes, forgiveness applied,
  base cost, overtime cost, total cost

Template (`cost-breakdown.component.html`):
```html
<mat-card class="breakdown-card">
  <mat-card-header>
    <mat-card-title i18n>Расчет стоимости</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <table class="breakdown-table">
      <tr>
        <td i18n>Плановое время:</td>
        <td>{{ data().cost.plannedMinutes }} мин</td>
      </tr>
      <tr>
        <td i18n>Фактическое время:</td>
        <td>{{ data().cost.actualMinutes }} мин</td>
      </tr>
      <tr>
        <td i18n>Тарифицируемое время:</td>
        <td>{{ data().cost.billableMinutes }} мин</td>
      </tr>
      @if (data().cost.overtimeMinutes > 0) {
        <tr class="overtime-row">
          <td i18n>Просрочка:</td>
          <td>{{ data().cost.overtimeMinutes }} мин</td>
        </tr>
      }
      @if (data().cost.forgivenessApplied) {
        <tr class="forgiveness-row">
          <td i18n>Прощение применено:</td>
          <td i18n>Да (до 7 мин бесплатно)</td>
        </tr>
      }
      <tr>
        <td i18n>Базовая стоимость:</td>
        <td>{{ data().cost.baseCost }} ₽</td>
      </tr>
      @if (data().cost.overtimeCost > 0) {
        <tr class="overtime-row">
          <td i18n>Доплата за просрочку:</td>
          <td>{{ data().cost.overtimeCost }} ₽</td>
        </tr>
      }
      <tr class="total-row">
        <td i18n>Итого:</td>
        <td><strong>{{ data().cost.totalCost }} ₽</strong></td>
      </tr>
    </table>

    @if (data().cost.calculationMessage) {
      <p class="calculation-message">{{ data().cost.calculationMessage }}</p>
    }
  </mat-card-content>
</mat-card>
```

CSS:
```css
.breakdown-table {
  width: 100%;
  border-collapse: collapse;
}

.breakdown-table td {
  padding: 8px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.breakdown-table td:first-child {
  color: rgba(0, 0, 0, 0.6);
}

.breakdown-table td:last-child {
  text-align: right;
  font-weight: 500;
}

.overtime-row td {
  color: #f44336 !important;
}

.forgiveness-row td {
  color: #4caf50 !important;
}

.total-row td {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  border-bottom: none;
  font-size: 16px;
}

.calculation-message {
  margin-top: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.54);
  font-style: italic;
}
```

### 12.3 — Add payment method selection before return

Update ReturnComponent to include a quick payment method selection after scan, before processing:

After QR scan, briefly show a payment method toggle before auto-processing. The `phase` can be enhanced:
`'scan' | 'method' | 'processing' | 'review'`

**method phase**:
```html
@case ('method') {
  <div class="method-phase">
    <h2 i18n>Способ оплаты (при доплате)</h2>
    <mat-button-toggle-group [value]="paymentMethod()" (change)="paymentMethod.set($event.value)">
      <mat-button-toggle value="CASH" i18n>Наличные</mat-button-toggle>
      <mat-button-toggle value="CARD" i18n>Карта</mat-button-toggle>
      <mat-button-toggle value="ELECTRONIC" i18n>Электронный</mat-button-toggle>
    </mat-button-toggle-group>

    <button mat-raised-button color="primary" (click)="confirmReturn()" class="full-width confirm-button">
      <span i18n>Оформить возврат</span>
    </button>
  </div>
}
```

Flow becomes: Scan → Method → Processing → Review/Done.

### 12.4 — Handle error cases

In `processReturn()` catch block:
- HTTP 404 → "Оборудование не найдено" or "Аренда не найдена"
- HTTP 422 → "Аренда не в активном статусе" or "Недостаточная предоплата"
- Other → generic error message

All errors: show via `mat-snackbar` and reset to scan phase.

### 12.5 — Verify build and end-to-end test

Test the full return flow:
1. Navigate to `/operator/return`
2. Scan QR (or enter UID manually)
3. Select payment method → tap "Оформить возврат"
4. See cost breakdown
5. See receipt number
6. Tap "Новый возврат" → returns to scan phase

Test edge cases:
- Invalid UID → error message → back to scan
- Equipment with no active rental → error
- Early return (< 10 min) → shows early return message
- Overtime with forgiveness → green forgiveness indicator
- Overtime without forgiveness → red overtime cost

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 12.1 | ReturnComponent (state machine: scan → method → processing → review) | Not Started | 2026-02-28 | |
| 12.2 | CostBreakdownComponent (dumb, cost table) | Not Started | 2026-02-28 | |
| 12.3 | Payment method selection phase | Not Started | 2026-02-28 | |
| 12.4 | Error handling for all failure cases | Not Started | 2026-02-28 | |
| 12.5 | Verify build and end-to-end test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with 4-phase return flow state machine
- Cost breakdown component designed with overtime/forgiveness color coding
- Early return detection (≤10 min)
- Payment method selection before API call
- Error handling for 404, 422, and generic errors

