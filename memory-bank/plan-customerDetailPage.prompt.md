# Plan: Customer Detail Page — Updated Design (TASK025 extension v2)

## Summary of Changes from v1

- `CustomerDetailComponent` and all supporting types/services are placed in a **shared feature** so both Admin and Operator can route to it at their respective URL prefixes
- **Balance** is now a real endpoint: `GET /api/finance/customers/{customerId}/balances` — no mock needed; `CustomerAccountBalances` domain type replaces the old `AccountBalance`
- **Transactions tab** added (3rd tab) backed by `GET /api/finance/customers/{customerId}/transactions`
- A dedicated **`FinanceService`** is introduced in `core/api/` to own all `/api/finance/**` calls
- `GET /api/customers/{id}` still does not exist in the API — `CustomerService.getById()` remains a stub

## Decisions

- `CustomerDetailComponent` lives at `src/app/features/customers/customer-detail/` — a **shared feature**, imported (lazy-loaded) by both `admin.routes.ts` and `operator.routes.ts`
- Admin URL: `/admin/customers/:id` — keeps existing admin nav consistent
- Operator URL: `/operator/customers/:id` — new entry point from the rental flow (e.g., after customer search)
- Profile is seeded from Router navigation state (`state.customer: CustomerSearchResponse`) immediately; `getById()` stub resolves in background (graceful degradation on direct URL)
- Transactions tab is lazy (loads on first `selectedTabChange`), matching the Payments tab pattern
- `FinanceService` holds `getBalances()` and `getTransactions()` — no finance logic bleeds into `CustomerService`
- System is designed for extensibility: each stub/service method follows the exact future API signature; no component changes needed when stubs go live

## Architecture: Shared Feature

```
src/app/features/customers/
  customer-detail/
    customer-detail.component.ts
    customer-detail.component.html
    customer-detail.spec.ts
```

Both lazy routes point to the same component class. The component is unaware of which shell it is rendered in.

## Steps

### 1. Domain + model layer

**`core/api/generated/models/customer.model.ts`** — add/update:

```typescript
export interface Customer {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: Date;
  comments?: string;
}
```

**`core/models/finance.model.ts`** — new file:

```typescript
export interface CustomerAccountBalances {
  walletBalance: number;
  holdBalance: number;
  lastUpdatedAt?: Date;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  sourceType?: string;
  sourceId?: string;
  createdAt: Date;
}
```

**`core/api/generated/models/customer.model.ts`** — add:

```typescript
export interface CustomerAccountBalancesResponse {
  walletBalance: number;
  holdBalance: number;
  lastUpdatedAt?: string;
}
```

**`core/api/generated/models/finance.model.ts`** — new file:

```typescript
export interface TransactionHistoryFilterParams {
  fromDate?: string;
  toDate?: string;
  sourceId?: string;
  sourceType?: 'RENTAL';
}

export interface TransactionResponse {
  id: string;
  type: string;
  amount: number;
  sourceType?: string;
  sourceId?: string;
  createdAt: string;
}
```

Export all new types from `core/models/index.ts` and `core/models/index.ts`.

### 2. Mappers

**`core/mappers/customer.mapper.ts`**:

- `CustomerMapper.fromResponse(r: CustomerResponse): Customer`
- `CustomerMapper.fromSearchResponse(r: CustomerSearchResponse): Customer`
- `CustomerMapper.fromBalancesResponse(r: CustomerAccountBalancesResponse): CustomerAccountBalances`

**`core/mappers/finance.mapper.ts`** — new file:

- `FinanceMapper.fromTransactionResponse(r: TransactionResponse): Transaction`

Export both mappers from `core/mappers/index.ts`.

### 3. Services

**`core/api/customer.service.ts`** — add stub:

```typescript
getById(id
:
string
):
Observable < Customer > {
  // TODO: GET /api/customers/:id — replace EMPTY when backend implements
  return EMPTY;
}
```

**`core/api/finance.service.ts`** — new file:

```typescript

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);

  getBalances(customerId: string): Observable<CustomerAccountBalances> {
    return this.http
      .get<CustomerAccountBalancesResponse>(`/api/finance/customers/${customerId}/balances`)
      .pipe(map(r => CustomerMapper.fromBalancesResponse(r)));
  }

  getTransactions(
    customerId: string,
    filter: TransactionHistoryFilterParams,
    page: number,
    size: number,
  ): Observable<PageResponse<Transaction>> {
    const params = { ...filter, page, size };
    return this.http
      .get<PageResponse<TransactionResponse>>(
        `/api/finance/customers/${customerId}/transactions`,
        { params },
      )
      .pipe(
        map(r => ({
          ...r,
          items: r.items.map(t => FinanceMapper.fromTransactionResponse(t)),
        })),
      );
  }
}
```

### 4. Routes

**`features/admin/admin.routes.ts`** — add child (existing `customers` list route untouched):

```typescript
{
  path: 'customers/:id',
    loadComponent
:
  () =>
    import('../customers/customer-detail/customer-detail.component').then(
      m => m.CustomerDetailComponent,
    ),
}
,
```

**`features/operator/operator.routes.ts`** — add child:

```typescript
{
  path: 'customers/:id',
    loadComponent
:
  () =>
    import('../customers/customer-detail/customer-detail.component').then(
      m => m.CustomerDetailComponent,
    ),
    data
:
  {
    showEdit: false
  }
,
}
,
```

Both resolve at:

- `/admin/customers/:id`
- `/operator/customers/:id`

### 5. `CustomerDetailComponent`

**Location**: `features/customers/customer-detail/customer-detail.component.ts`
**Pattern**: Smart, `OnPush`, standalone, `inject()` DI, signal state

#### Input signals

```typescript
showEdit = input(true);
```

The admin route leaves this at default (`true`); the operator route data overrides to `false` — component reads it via `inject(ActivatedRoute).snapshot.data['showEdit'] ?? true` and converts to a `signal`.

The component emits `editRequested = output<Customer>()` when the Edit button is clicked — the parent shell (admin list) handles opening `CustomerDialogComponent`. This keeps the shared component free of admin-only dialog imports.

#### Template zones

##### Header row

- Back-arrow `mat-icon-button` → `location.back()`
- Breadcrumb title: customer name from loaded profile or phone from nav-state seed or id fallback

##### Info strip — two `mat-card` (side-by-side ≥md, stacked below)

① **Profile card**

- Fields: phone, firstName, lastName, email, birthDate, comments
- "Loading…" skeleton while `getById()` returns `EMPTY`; nav-state seed shown immediately for name/phone
- Edit button visible only when `showEdit()` is true; on click emits `editRequested`

② **Balance card** (`GET /api/finance/customers/{customerId}/balances`)

- `balances = signal<CustomerAccountBalances | null>(null)`
- Loads via `FinanceService.getBalances(id)` on init
- Shows: wallet balance, hold balance, last updated timestamp
- Error/null state: `–` for each figure

##### `mat-tab-group` — three tabs

**Tab 0: Rentals** (auto-loads on init)

- `RentalService.search({ customerId: id })` — paginated
- `mat-table`: id, status, startedAt, expectedReturnAt, overdueMinutes
- `mat-paginator`
- Empty state: `Labels.NoRentals`

**Tab 1: Transactions** (lazy — loads on first `selectedTabChange`)

- `transactionsLoaded = signal(false)` guard
- `FinanceService.getTransactions(id, {}, page, size)`
- `mat-table`: id, type, amount, sourceType, sourceId, createdAt
- `mat-paginator`
- Empty state: `Labels.NoTransactions`

**Tab 2: Payments** (lazy — loads on first `selectedTabChange`)

- `paymentsLoaded = signal(false)` guard
- `PaymentService.getByCustomer(id)` — stub `of([])` until backend ships
- `mat-table`: id, rentalId, amount, paymentType, paymentMethod, createdAt
- Empty state: `Labels.NoPayments`

### 6. "View details" in `CustomerListComponent` (admin)

Add eye-icon `mat-icon-button` per row in the actions column:

```typescript
router.navigate(['/admin/customers', row.id], { state: { customer: row } });
```

### 7. Operator entry point

In the operator rental flow (customer search step in `rental-create`), add a view-details button:

```typescript
router.navigate(['/operator/customers', customer.id], { state: { customer } });
```

### 8. Labels

Add to `shared/constant/labels.ts`:

```typescript
static readonly
CustomerDetails = $localize`Customer Details`;
static readonly
Back = $localize`Back`;
static readonly
ViewDetails = $localize`View Details`;
static readonly
WalletBalance = $localize`Wallet Balance`;
static readonly
HoldBalance = $localize`Hold Balance`;
static readonly
LastUpdated = $localize`Last updated`;
static readonly
NoRentals = $localize`No rentals found`;
static readonly
NoTransactions = $localize`No transactions found`;
static readonly
NoPayments = $localize`No payments found`;
static readonly
ProfileUnavailable = $localize`Profile not available — open from the customers list`;
static readonly
RentalsTab = $localize`Rentals`;
static readonly
TransactionsTab = $localize`Transactions`;
static readonly
PaymentsTab = $localize`Payments`;
```

### 9. Update TASK025

Update subtasks in `memory-bank/tasks/TASK025-admin-customers.md`:

| ID   | Description                                             | Status      |
|------|---------------------------------------------------------|-------------|
| 25.5 | FinanceService + domain models + mappers                | Not Started |
| 25.6 | CustomerDetailComponent (shared feature)                | Not Started |
| 25.7 | Operator route + entry point wiring                     | Not Started |
| 25.8 | Unit tests for CustomerDetailComponent + FinanceService | Not Started |

## Extensibility Contract

| Method                                                   | Endpoint                                      | Status                                     |
|----------------------------------------------------------|-----------------------------------------------|--------------------------------------------|
| `CustomerService.getById(id)`                            | `GET /api/customers/:id`                      | Stub — replace `EMPTY` when backend ships  |
| `FinanceService.getBalances(id)`                         | `GET /api/finance/customers/:id/balances`     | ✅ Live — fully implemented                 |
| `FinanceService.getTransactions(id, filter, page, size)` | `GET /api/finance/customers/:id/transactions` | ✅ Live — fully implemented                 |
| `PaymentService.getByCustomer(id)`                       | `GET /api/payments/by-customer/:id`           | Stub — replace `of([])` when backend ships |

## Shared Feature Folder Contract

`features/customers/` is a **shared feature** — it must:

- Import only from `core/` and `shared/` (never from `features/admin/` or `features/operator/`)
- Have zero knowledge of which shell rendered it
- Communicate admin-specific actions (edit dialog) via output events, not direct imports

## Direct URL Access Behaviour

- `getById()` returns `EMPTY` → profile card shows `ProfileUnavailable` label; page still renders
- Balance, transactions, and rentals load normally via live endpoints
- No hard redirect on direct URL access
