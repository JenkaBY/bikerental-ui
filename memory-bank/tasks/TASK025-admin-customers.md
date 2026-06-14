# TASK025 - Admin: Customers Page

**Status:** In Progress  
**Added:** 2026-03-24  
**Updated:** 2026-04-17  
**Depends on:** TASK003  
**Blocks:** None

## Original Request

Customers page: paginated list with search by ≥4 digits of the phone number, plus Create and Edit customer dialog.

## Thought Process

- Search input with debounce (400 ms), min 4 chars, triggers `CustomerService.searchByPhone()`
- Results shown in `mat-table`
- Create button opens empty dialog; Edit button opens pre-filled dialog
- `GET /api/customers/{id}` endpoint is now available — edit dialog fetches full customer data by id to pre-fill all fields
- `CustomerService.createCustomer()` / `updateCustomer()` for persist
- Pattern follows TASK005 (EquipmentType list + dialog)

## Implementation Plan

- 25.1 CustomerListComponent — phone search, table, Create + Edit + View Details buttons
- 25.2 CustomerDialogComponent — Create/Edit form (phone, firstName, lastName, email, birthDate, comments)
- 25.3 Add new i18n labels to `labels.ts` and error messages to `form-error-messages.ts`
- 25.4 Unit tests for list + dialog
- 25.5 CustomerDetailComponent — profile card, balance card, Rentals tab, Payments tab + 3 service stubs
  - Customer domain model + AccountBalance domain model (`core/models/customer.model.ts`)
  - AccountBalanceResponse (`core/models/customer.model.ts`)
  - CustomerMapper (`core/mappers/customer.mapper.ts`)
  - CustomerService.getById() — real implementation using `GET /api/customers/{id}` + getBalance() stub
  - PaymentService.getByCustomer() stub
  - Route: `customers/:id` in admin.routes.ts
- 25.6 Unit tests for CustomerDetailComponent

## Progress Tracking

**Overall Status:** In Progress — 10%

### Subtasks

| ID   | Description                              | Status      | Updated    | Notes |
|------|------------------------------------------|-------------|------------|-------|
| 25.1 | CustomerListComponent                    | Not Started | 2026-03-24 |       |
| 25.2 | CustomerDialogComponent                  | Not Started | 2026-03-24 |       |
| 25.3 | Labels / error messages                  | Complete    | 2026-03-24 |       |
| 25.4 | Unit tests (list + dialog)               | Not Started | 2026-03-24 |       |
| 25.5 | CustomerDetailComponent + domain + stubs | Not Started | 2026-03-25 |       |
| 25.6 | Unit tests (detail)                      | Not Started | 2026-03-25 |       |

## Progress Log

### 2026-04-17

- `GET /api/customers/{id}` endpoint confirmed in OpenAPI docs — `CustomerService.getById()` should be a real HTTP call, not a stub
- Edit dialog (25.2) should fetch full customer via `getById()` to pre-fill all fields (email, birthDate, comments) — no longer relying on search-result state
- CustomerDetailComponent (25.5) can also use `getById()` for profile data on direct URL access without navigation state fallback being required

### 2026-03-25

- Extended scope with Customer Detail page (subtasks 25.5, 25.6)
- Decision: profile sourced from Router navigation state; degrades gracefully on direct URL access
- Decision: Payments use Option B (lazy tab, loads on first tab selection)
- Decision: AccountBalance uses a mock `{ amount: 0, currency: 'BYN' }` until `GET /api/customers/:id/balance` ships
- Three new stub methods defined: `CustomerService.getById()`, `CustomerService.getBalance()`, `PaymentService.getByCustomer()`
- Plan saved to `plan-customerDetailPage.prompt.md`

### 2026-03-24

- Task created, split from TASK009
- Added i18n labels and error messages

