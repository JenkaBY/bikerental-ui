# TASK011 - Operator: Rental Creation Flow (Mobile, Multi-Step)

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK004  
**Blocks:** TASK012 (shared QR scanner component created here)

## Original Request

Build the full rental creation flow as a mobile stepper. Four steps:
1. Customer search / create
2. Equipment input (UID manual entry or QR code scan via camera)
3. Duration selection + auto-tariff display
4. Prepayment + confirmation

Uses Angular Material stepper optimized for mobile. Also creates the shared QR scanner component (`html5-qrcode`)
that will be reused in TASK012 (return flow).

## Thought Process

This is the most complex operator feature. It must be fast (< 60 seconds for a complete rental) and touch-friendly.

**Stepper approach**: `mat-vertical-stepper` with `linear` mode — user must complete each step before proceeding.
Each step is a child component (dumb) that receives inputs and emits outputs. The parent `RentalCreateComponent`
(smart) orchestrates the flow: calls services, manages state, handles navigation between steps.

**Step 1 — Customer**: operator types phone digits → debounced search → results as selection list. If not found,
a "Create new" toggle reveals an inline form (two modes: quick = phone only, full = all fields).

**Step 2 — Equipment**: operator types UID manually OR taps "Scan QR" to open camera overlay. The QR scanner
reads the equipment UID. Parent fetches equipment by UID to validate it exists and is available.

**Step 3 — Duration**: four large buttons (30 min, 1 hour, 2 hours, day). On selection, parent calls
`TariffService.selectTariff()` and displays the auto-selected tariff info.

**Step 4 — Confirm**: summary of all selections, payment method selector (cash/card/electronic), amount
pre-filled with tariff price, "Start Rental" button.

**On confirm**: parent calls `RentalService.create(CreateRentalRequest)` → on success calls
`RentalService.recordPrepayment(rentalId, RecordPrepaymentRequest)` → shows success snackbar →
navigates to dashboard.

### QR Scanner shared component
The QR scanner is a reusable component in `src/app/shared/components/qr-scanner/`. It uses `html5-qrcode`
to access the phone's rear camera, decode QR codes, and emit the decoded string. It renders as a fullscreen
overlay with a viewfinder rectangle and a cancel button.

**`html5-qrcode` usage pattern**:
```typescript
import { Html5Qrcode } from 'html5-qrcode';

const html5QrCode = new Html5Qrcode('reader');
await html5QrCode.start(
  { facingMode: 'environment' }, // rear camera
  { fps: 10, qrbox: { width: 250, height: 250 } },
  (decodedText) => { /* emit result */ },
  (errorMessage) => { /* ignore scan errors, they happen on every frame without QR */ }
);
// On destroy:
await html5QrCode.stop();
```

## Implementation Plan

### 11.1 — Install html5-qrcode (if not done in TASK001)

Verify `html5-qrcode` is in `package.json`. If not:
```powershell
npm install html5-qrcode
```

### 11.2 — Create QrScannerComponent (shared)

Create `src/app/shared/components/qr-scanner/qr-scanner.component.ts`:

- Standalone, `OnPush`
- Imports: `MatButtonModule`, `MatIconModule`
- Output: `scanned = output<string>()` — emits decoded QR text
- Output: `cancelled = output<void>()` — emits when user taps cancel
- Uses `html5-qrcode` library
- On init (`afterViewInit`): start camera scanner
- On destroy: stop camera scanner
- Template has a `<div id="qr-reader">` container for the library and a cancel button

Template (`qr-scanner.component.html`):
```html
<div class="qr-overlay">
  <div class="qr-header">
    <span i18n>Сканируйте QR-код</span>
    <button mat-icon-button (click)="onCancel()">
      <mat-icon>close</mat-icon>
    </button>
  </div>
  <div id="qr-reader" class="qr-reader"></div>
  <p class="qr-hint" i18n>Наведите камеру на QR-код оборудования</p>
</div>
```

CSS (`qr-scanner.component.css`):
```css
.qr-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px;
  color: white;
}

.qr-reader {
  width: 100%;
  max-width: 400px;
  flex: 1;
}

.qr-hint {
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 16px;
}
```

Component logic:
```typescript
import { Component, afterNextRender, output, OnDestroy, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrScannerComponent implements OnDestroy {
  readonly scanned = output<string>();
  readonly cancelled = output<void>();

  private html5QrCode: Html5Qrcode | null = null;

  constructor() {
    afterNextRender(() => this.startScanner());
  }

  private async startScanner(): Promise<void> {
    this.html5QrCode = new Html5Qrcode('qr-reader');
    try {
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          this.scanned.emit(decodedText);
          this.stopScanner();
        },
        () => { /* ignore frame scan errors */ }
      );
    } catch (err) {
      console.error('QR scanner failed to start:', err);
    }
  }

  private async stopScanner(): Promise<void> {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
      } catch { /* ignore */ }
      this.html5QrCode = null;
    }
  }

  onCancel(): void {
    this.stopScanner();
    this.cancelled.emit();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }
}
```

### 11.3 — Create RentalCreateComponent (smart container)

Replace placeholder at `src/app/features/operator/rental-create/rental-create.component.ts`:

- Standalone, `OnPush`
- Imports: `MatStepperModule`, `MatButtonModule`, `MatSnackBar`
- Injects: `RentalService`, `TariffService`, `EquipmentService`, `CustomerService`, `AuthService`, `Router`, `MatSnackBar`
- Signals:
  - `selectedCustomer = signal<CustomerSearchResponse | CustomerResponse | null>(null)`
  - `selectedEquipment = signal<EquipmentResponse | null>(null)`
  - `selectedDuration = signal<number | null>(null)` (minutes)
  - `selectedTariff = signal<TariffSelectionResponse | null>(null)`
  - `submitting = signal(false)`
- Child components communicate via `output()` events → parent updates signals

Template:
```html
<mat-vertical-stepper [linear]="true" #stepper>
  <mat-step [completed]="selectedCustomer() !== null">
    <ng-template matStepLabel i18n>Клиент</ng-template>
    <app-customer-step
      (customerSelected)="onCustomerSelected($event)"
    />
  </mat-step>

  <mat-step [completed]="selectedEquipment() !== null">
    <ng-template matStepLabel i18n>Оборудование</ng-template>
    <app-equipment-step
      (equipmentSelected)="onEquipmentSelected($event)"
    />
  </mat-step>

  <mat-step [completed]="selectedTariff() !== null">
    <ng-template matStepLabel i18n>Время и тариф</ng-template>
    <app-duration-step
      [tariff]="selectedTariff()"
      (durationSelected)="onDurationSelected($event)"
    />
  </mat-step>

  <mat-step>
    <ng-template matStepLabel i18n>Оплата и старт</ng-template>
    <app-confirm-step
      [customer]="selectedCustomer()"
      [equipment]="selectedEquipment()"
      [duration]="selectedDuration()"
      [tariff]="selectedTariff()"
      [submitting]="submitting()"
      (confirmed)="onConfirmed($event)"
    />
  </mat-step>
</mat-vertical-stepper>
```

Parent methods:
- `onCustomerSelected(customer)`: sets signal, stepper moves to next step
- `onEquipmentSelected(equipment)`: sets signal, if equipment type is known, prepares for tariff selection
- `onDurationSelected(minutes)`: sets signal, calls `TariffService.selectTariff(equipmentType, minutes)` → sets `selectedTariff`
- `onConfirmed({ paymentMethod, amount })`:
  1. Build `CreateRentalRequest` with `customerId`, `equipmentId`, ISO duration from minutes, `tariffId`
  2. Call `RentalService.create(request)`
  3. On success: call `RentalService.recordPrepayment(rentalId, { amount, paymentMethod, operatorId: currentUser.username })`
  4. On success: show `mat-snackbar` "Аренда создана", navigate to `/operator/dashboard`
  5. On error: show error snackbar, set `submitting(false)`

### 11.4 — Create CustomerStepComponent

Create `src/app/features/operator/rental-create/customer-step/customer-step.component.ts`:

- Standalone, `OnPush`, dumb component
- Imports: `MatFormFieldModule`, `MatInputModule`, `MatListModule`, `MatButtonModule`, `MatIconModule`,
  `MatButtonToggleModule`, `ReactiveFormsModule`
- Injects: `CustomerService` (exception to dumb rule for simplicity — search is local to this step)
- Output: `customerSelected = output<CustomerSearchResponse | CustomerResponse>()`
- Signals:
  - `searchResults = signal<CustomerSearchResponse[]>([])`
  - `showCreateForm = signal(false)`
  - `createMode = signal<'quick' | 'full'>('quick')`
  - `searching = signal(false)`
  - `creating = signal(false)`
- Phone search: `FormControl<string>`, debounce 400ms, min 4 chars → call `CustomerService.searchByPhone()`
- Create form: `FormGroup` with phone (required), firstName (required if full), lastName (required if full),
  email (optional), birthDate (optional)
- Quick mode: only phone field + save
- Full mode: all fields

Template — two sections: search section and create section (toggle):
```html
<div class="customer-step">
  <mat-form-field appearance="outline" class="full-width">
    <mat-label i18n>Телефон (мин. 4 цифры)</mat-label>
    <input matInput [formControl]="phoneSearch" inputmode="tel">
    <mat-icon matPrefix>search</mat-icon>
  </mat-form-field>

  @if (searching()) {
    <p i18n>Поиск...</p>
  }

  @if (searchResults().length > 0) {
    <mat-selection-list [multiple]="false" (selectionChange)="onSelectCustomer($event)">
      @for (customer of searchResults(); track customer.id) {
        <mat-list-option [value]="customer">
          {{ customer.firstName }} {{ customer.lastName }} — {{ customer.phone }}
        </mat-list-option>
      }
    </mat-selection-list>
  }

  @if (searchResults().length === 0 && phoneSearch.value && phoneSearch.value.length >= 4 && !searching()) {
    <p i18n>Клиент не найден</p>
  }

  <button mat-stroked-button (click)="showCreateForm.set(!showCreateForm())" class="create-toggle">
    <mat-icon>person_add</mat-icon>
    <span i18n>Создать нового клиента</span>
  </button>

  @if (showCreateForm()) {
    <div class="create-form">
      <mat-button-toggle-group [value]="createMode()" (change)="createMode.set($event.value)">
        <mat-button-toggle value="quick" i18n>Быстрый (только телефон)</mat-button-toggle>
        <mat-button-toggle value="full" i18n>Полный</mat-button-toggle>
      </mat-button-toggle-group>

      <form [formGroup]="createForm" (ngSubmit)="onCreateCustomer()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n>Телефон</mat-label>
          <input matInput formControlName="phone" inputmode="tel">
        </mat-form-field>

        @if (createMode() === 'full') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label i18n>Имя</mat-label>
            <input matInput formControlName="firstName">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label i18n>Фамилия</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label i18n>Email</mat-label>
            <input matInput formControlName="email" type="email">
          </mat-form-field>
        }

        <button mat-raised-button color="primary" type="submit" [disabled]="creating()" class="full-width">
          <span i18n>Создать клиента</span>
        </button>
      </form>
    </div>
  }
</div>
```

Quick mode: sends `CustomerRequest` with phone + placeholder firstName "Клиент" + placeholder lastName "—".
Full mode: sends complete `CustomerRequest`.

On successful create → emit `customerSelected` with the returned `CustomerResponse`.

### 11.5 — Create EquipmentStepComponent

Create `src/app/features/operator/rental-create/equipment-step/equipment-step.component.ts`:

- Standalone, `OnPush`, dumb component
- Imports: `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatIconModule`, `MatCardModule`, `QrScannerComponent`
- Injects: `EquipmentService`
- Output: `equipmentSelected = output<EquipmentResponse>()`
- Signals:
  - `scanning = signal(false)`
  - `equipment = signal<EquipmentResponse | null>(null)`
  - `loading = signal(false)`
  - `error = signal<string | null>(null)`
- UID input: `FormControl<string>`, on Enter or blur → fetch equipment
- "Scan QR" button → sets `scanning(true)` → renders `<app-qr-scanner>`
- On QR scanned → sets UID → fetches equipment
- On equipment fetched: if status ≠ "available", show warning but still allow selection
- "Выбрать" button → emits `equipmentSelected`

Template:
```html
<div class="equipment-step">
  @if (scanning()) {
    <app-qr-scanner
      (scanned)="onQrScanned($event)"
      (cancelled)="scanning.set(false)"
    />
  } @else {
    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>UID оборудования</mat-label>
      <input matInput [formControl]="uidInput" (keyup.enter)="fetchEquipment()">
      <mat-icon matPrefix>qr_code</mat-icon>
    </mat-form-field>

    <button mat-stroked-button (click)="scanning.set(true)" class="full-width scan-button">
      <mat-icon>qr_code_scanner</mat-icon>
      <span i18n>Сканировать QR-код</span>
    </button>

    @if (loading()) {
      <p i18n>Загрузка...</p>
    }

    @if (error()) {
      <p class="error-text">{{ error() }}</p>
    }

    @if (equipment()) {
      <mat-card class="equipment-card">
        <mat-card-content>
          <p><strong i18n>UID:</strong> {{ equipment()!.uid }}</p>
          <p><strong i18n>Модель:</strong> {{ equipment()!.model }}</p>
          <p><strong i18n>Тип:</strong> {{ equipment()!.type }}</p>
          <p><strong i18n>Статус:</strong> {{ equipment()!.status }}</p>
        </mat-card-content>
      </mat-card>
      <button mat-raised-button color="primary" (click)="onSelect()" class="full-width">
        <span i18n>Выбрать оборудование</span>
      </button>
    }
  }
</div>
```

### 11.6 — Create DurationStepComponent

Create `src/app/features/operator/rental-create/duration-step/duration-step.component.ts`:

- Standalone, `OnPush`, dumb component
- Imports: `MatButtonToggleModule`, `MatCardModule`
- Input: `tariff = input<TariffSelectionResponse | null>(null)`
- Output: `durationSelected = output<number>()` (minutes)
- Four large buttons for duration options

Template:
```html
<div class="duration-step">
  <p i18n>Выберите время аренды:</p>
  <div class="duration-grid">
    <button mat-raised-button class="duration-button" (click)="selectDuration(30)">
      <span class="duration-label" i18n>30 мин</span>
    </button>
    <button mat-raised-button class="duration-button" (click)="selectDuration(60)">
      <span class="duration-label" i18n>1 час</span>
    </button>
    <button mat-raised-button class="duration-button" (click)="selectDuration(120)">
      <span class="duration-label" i18n>2 часа</span>
    </button>
    <button mat-raised-button class="duration-button" (click)="selectDuration(1440)">
      <span class="duration-label" i18n>Сутки</span>
    </button>
  </div>

  @if (tariff()) {
    <mat-card class="tariff-card">
      <mat-card-content>
        <p><strong i18n>Тариф:</strong> {{ tariff()!.name }}</p>
        <p><strong i18n>Цена:</strong> {{ tariff()!.price }} ₽</p>
        <p><strong i18n>Период:</strong> {{ tariff()!.period }}</p>
      </mat-card-content>
    </mat-card>
  }
</div>
```

CSS:
```css
.duration-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
}

.duration-button {
  height: 64px;
  font-size: 18px;
}
```

### 11.7 — Create ConfirmStepComponent

Create `src/app/features/operator/rental-create/confirm-step/confirm-step.component.ts`:

- Standalone, `OnPush`, dumb component
- Imports: `MatCardModule`, `MatButtonToggleModule`, `MatButtonModule`, `MatFormFieldModule`, `MatInputModule`
- Inputs: `customer`, `equipment`, `duration`, `tariff`, `submitting`
- Output: `confirmed = output<{ paymentMethod: PaymentMethod; amount: number }>()`
- Payment method: `mat-button-toggle-group` with CASH, CARD, ELECTRONIC
- Amount input: pre-filled with `tariff.price`, editable

Template:
```html
<div class="confirm-step">
  <mat-card class="summary-card">
    <mat-card-header>
      <mat-card-title i18n>Итого</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      @if (customer()) {
        <p><strong i18n>Клиент:</strong> {{ customer()!.firstName ?? '' }} {{ customer()!.lastName ?? '' }} — {{ customer()!.phone }}</p>
      }
      @if (equipment()) {
        <p><strong i18n>Оборудование:</strong> {{ equipment()!.uid }} ({{ equipment()!.model }})</p>
      }
      @if (duration()) {
        <p><strong i18n>Время:</strong> {{ formatDuration(duration()!) }}</p>
      }
      @if (tariff()) {
        <p><strong i18n>Тариф:</strong> {{ tariff()!.name }} — {{ tariff()!.price }} ₽</p>
      }
    </mat-card-content>
  </mat-card>

  <p i18n>Способ оплаты:</p>
  <mat-button-toggle-group [value]="paymentMethod()" (change)="paymentMethod.set($event.value)">
    <mat-button-toggle value="CASH" i18n>Наличные</mat-button-toggle>
    <mat-button-toggle value="CARD" i18n>Карта</mat-button-toggle>
    <mat-button-toggle value="ELECTRONIC" i18n>Электронный</mat-button-toggle>
  </mat-button-toggle-group>

  <mat-form-field appearance="outline" class="full-width amount-field">
    <mat-label i18n>Сумма</mat-label>
    <input matInput type="number" [formControl]="amountControl" min="0" step="0.01">
    <span matTextSuffix>₽</span>
  </mat-form-field>

  <button mat-raised-button color="primary" class="full-width start-button"
    (click)="onConfirm()" [disabled]="submitting()">
    @if (submitting()) {
      <span i18n>Создание аренды...</span>
    } @else {
      <span i18n>Начать аренду</span>
    }
  </button>
</div>
```

CSS:
```css
.start-button {
  height: 56px;
  font-size: 18px;
  margin-top: 16px;
}
```

Helper method `formatDuration(minutes: number): string` → "30 мин" / "1 час" / "2 часа" / "Сутки".

Duration-to-ISO mapping for API: 30 → "PT30M", 60 → "PT1H", 120 → "PT2H", 1440 → "P1D".

### 11.8 — Verify build and end-to-end test

Test the full flow:
1. Navigate to `/operator/rental/new`
2. Step 1: search phone → select customer
3. Step 2: enter UID → equipment info displayed → select
4. Step 3: tap "1 час" → tariff auto-selected and displayed
5. Step 4: select payment method, confirm amount → tap "Начать аренду"
6. Should redirect to dashboard with snackbar "Аренда создана"

Also test QR scanner (requires phone or camera-enabled device).

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 11.1 | Verify html5-qrcode installed | Not Started | 2026-02-28 | |
| 11.2 | QrScannerComponent (shared) | Not Started | 2026-02-28 | Reused by TASK012 |
| 11.3 | RentalCreateComponent (smart container + stepper) | Not Started | 2026-02-28 | |
| 11.4 | CustomerStepComponent (search + create) | Not Started | 2026-02-28 | Quick + full mode |
| 11.5 | EquipmentStepComponent (UID input + QR scan) | Not Started | 2026-02-28 | |
| 11.6 | DurationStepComponent (4 buttons + tariff display) | Not Started | 2026-02-28 | |
| 11.7 | ConfirmStepComponent (summary + payment + start) | Not Started | 2026-02-28 | |
| 11.8 | Verify build and end-to-end test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with full 4-step stepper design
- QR scanner component designed using html5-qrcode
- Customer step supports quick and full creation modes
- Duration mapped to ISO-8601 for API calls

