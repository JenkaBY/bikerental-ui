# TASK009 - Admin: Customers, Rental History, Payment History, Users Placeholder

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK003  
**Blocks:** None

## Original Request

Build the remaining admin pages: customer search + edit dialog, rental history read-only table with filters,
payment history read-only table with rental ID search, and user management placeholder page with a static mock
table and a message that the API is coming later.

## Thought Process

This task bundles 4 simpler pages that follow established patterns:
1. **Customers** — search by phone + edit dialog (similar to TASK005 pattern but with phone search instead of full list)
2. **Rental History** — read-only paginated table with filters (similar to TASK007 pattern but no create/edit)
3. **Payment History** — search by rental ID, read-only results (simple search + table)
4. **Users Placeholder** — static page with mock data in a table

### Customers
- Search input for phone (min 4 digits, same pattern as operator flow)
- Results displayed in `mat-table`
- Edit button opens dialog with full `CustomerRequest` form
- No "Create" button in admin — customer creation is operator's job
- API: `GET /api/customers?phone=`, `PUT /api/customers/{id}`

### Rental History
- Paginated table of all rentals (not just active)
- Filters: status (dropdown: DRAFT, ACTIVE, COMPLETED, CANCELLED), customerId (text), equipmentUid (text)
- Read-only — no edit/create
- API: `GET /api/rentals?status=&customerId=&equipmentUid=&page=&size=`
- Columns: ID, Customer ID, Equipment ID, Status, Started At, Expected Return, Overdue Minutes

### Payment History
- Search by rental ID (text input)
- Show all payments for that rental in a table
- Read-only
- API: `GET /api/payments/by-rental/{rentalId}`
- Columns: ID, Rental ID, Amount, Type, Method, Operator, Receipt Number, Created At

### Users Placeholder
- `mat-card` with message: "Управление пользователями будет доступно после реализации API"
- `mat-table` with hardcoded mock data (2-3 rows) to show the intended layout
- Columns: Username, Role, Email, Status
- Mock data defined as a constant array in the component

## Implementation Plan

### 9.1 — Create CustomerListComponent

Replace placeholder at `src/app/features/admin/customers/customer-list.component.ts`:

- Standalone, `OnPush`
- Imports: `MatTableModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatIconModule`,
  `MatCardModule`, `MatDialog`, `ReactiveFormsModule`
- Phone search input with `FormControl<string>`, debounce 400ms, min length 4
- On search: call `CustomerService.searchByPhone(phone)`, store results in signal
- Edit button → opens `CustomerDialogComponent`

Template:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>Клиенты</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <mat-form-field appearance="outline" class="search-field">
      <mat-label i18n>Поиск по телефону (мин. 4 цифры)</mat-label>
      <input matInput [formControl]="phoneSearch" placeholder="+7916...">
      <mat-icon matPrefix>search</mat-icon>
    </mat-form-field>

    @if (customers().length > 0) {
      <table mat-table [dataSource]="customers()" class="full-width">
        <!-- columns: phone, firstName, lastName, email, birthDate, actions -->
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    } @else if (phoneSearch.value && phoneSearch.value.length >= 4) {
      <p i18n>Клиенты не найдены</p>
    }
  </mat-card-content>
</mat-card>
```

### 9.2 — Create CustomerDialogComponent

Create `src/app/features/admin/customers/customer-dialog.component.ts`:

- Data: `{ customer: CustomerResponse }`  (edit only in admin)
- Form: `phone` (required, pattern `^\+?[0-9\-\s()]+$`), `firstName` (required), `lastName` (required),
  `email` (email validator), `birthDate` (datepicker, must be in past), `comments` (textarea)
- On save: call `CustomerService.updateCustomer(id, request)`

### 9.3 — Create RentalHistoryComponent

Replace placeholder at `src/app/features/admin/rentals/rental-history.component.ts`:

- Standalone, `OnPush`
- Imports: `MatTableModule`, `MatPaginatorModule`, `MatFormFieldModule`, `MatSelectModule`, `MatInputModule`,
  `MatCardModule`, `DatePipe`
- Filters: status (select), customerId (text input), equipmentUid (text input)
- Paginated table with `mat-paginator`
- On filter change or page change: call `RentalService.search(status, customerId, equipmentUid, pageable)`
- Columns: `id`, `customerId`, `equipmentId`, `status`, `startedAt`, `expectedReturnAt`, `overdueMinutes`
- Overdue column: show red text if `overdueMinutes > 0`
- Dates formatted with `DatePipe`

Template:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>История аренд</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="filter-bar">
      <mat-form-field appearance="outline">
        <mat-label i18n>Статус</mat-label>
        <mat-select (selectionChange)="onStatusChange($event.value)">
          <mat-option i18n>Все</mat-option>
          <mat-option value="DRAFT">DRAFT</mat-option>
          <mat-option value="ACTIVE">ACTIVE</mat-option>
          <mat-option value="COMPLETED">COMPLETED</mat-option>
          <mat-option value="CANCELLED">CANCELLED</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label i18n>ID клиента</mat-label>
        <input matInput (input)="onCustomerIdChange($event)">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label i18n>UID оборудования</mat-label>
        <input matInput (input)="onEquipmentUidChange($event)">
      </mat-form-field>
    </div>

    <table mat-table [dataSource]="rentals()" class="full-width">
      <!-- standard columns -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <mat-paginator [length]="totalItems()" [pageSize]="20" [pageSizeOptions]="[10, 20, 50]"
      (page)="onPageChange($event)" showFirstLastButtons>
    </mat-paginator>
  </mat-card-content>
</mat-card>
```

### 9.4 — Create PaymentHistoryComponent

Replace placeholder at `src/app/features/admin/payments/payment-history.component.ts`:

- Standalone, `OnPush`
- Imports: `MatTableModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatCardModule`, `DatePipe`, `DecimalPipe`
- Search input for rental ID (number)
- On search: call `PaymentService.getByRental(rentalId)`, store results in signal
- Columns: `id`, `rentalId`, `amount`, `paymentType`, `paymentMethod`, `operatorId`, `receiptNumber`, `createdAt`

Template:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>История платежей</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="search-bar">
      <mat-form-field appearance="outline">
        <mat-label i18n>ID аренды</mat-label>
        <input matInput type="number" (keyup.enter)="searchPayments()">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="searchPayments()" i18n>Поиск</button>
    </div>

    @if (payments().length > 0) {
      <table mat-table [dataSource]="payments()" class="full-width">
        <!-- columns -->
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    } @else if (searched()) {
      <p i18n>Платежи не найдены</p>
    }
  </mat-card-content>
</mat-card>
```

### 9.5 — Create UserPlaceholderComponent

Replace placeholder at `src/app/features/admin/users/user-placeholder.component.ts`:

- Standalone, `OnPush`
- Imports: `MatTableModule`, `MatCardModule`, `MatIconModule`
- Hardcoded mock data:
```typescript
readonly mockUsers = [
  { username: 'admin', role: 'ADMIN', email: 'admin@bikerental.local', status: 'Активен' },
  { username: 'operator1', role: 'OPERATOR', email: 'op1@bikerental.local', status: 'Активен' },
  { username: 'operator2', role: 'OPERATOR', email: 'op2@bikerental.local', status: 'Заблокирован' }
];
```
- Table columns: `username`, `role`, `email`, `status`
- Banner message above table

Template:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>Пользователи</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="placeholder-banner">
      <mat-icon>info</mat-icon>
      <span i18n>Управление пользователями будет доступно после реализации API авторизации.</span>
    </div>

    <table mat-table [dataSource]="mockUsers" class="full-width">
      <ng-container matColumnDef="username">
        <th mat-header-cell *matHeaderCellDef i18n>Имя пользователя</th>
        <td mat-cell *matCellDef="let row">{{ row.username }}</td>
      </ng-container>
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef i18n>Роль</th>
        <td mat-cell *matCellDef="let row">{{ row.role }}</td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef i18n>Email</th>
        <td mat-cell *matCellDef="let row">{{ row.email }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef i18n>Статус</th>
        <td mat-cell *matCellDef="let row">{{ row.status }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="['username', 'role', 'email', 'status']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['username', 'role', 'email', 'status']"></tr>
    </table>
  </mat-card-content>
</mat-card>
```

CSS:
```css
.placeholder-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff3e0;
  border-radius: 4px;
  color: #e65100;
}
```

### 9.6 — Verify build and test

Test all 4 pages:
- Customer search → edit dialog
- Rental history → filters + pagination
- Payment history → search by rental ID
- Users → static table with mock data

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 9.1 | CustomerListComponent (phone search + table) | Not Started | 2026-02-28 | |
| 9.2 | CustomerDialogComponent (edit form) | Not Started | 2026-02-28 | |
| 9.3 | RentalHistoryComponent (paginated + filters) | Not Started | 2026-02-28 | |
| 9.4 | PaymentHistoryComponent (search by rental) | Not Started | 2026-02-28 | |
| 9.5 | UserPlaceholderComponent (mock table + message) | Not Started | 2026-02-28 | |
| 9.6 | Verify build and test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created bundling 4 remaining admin pages
- Customer edit-only (no create in admin)
- Rental/payment history are read-only
- Users placeholder with 3 mock rows

