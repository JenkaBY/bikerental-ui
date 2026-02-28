# Product Context

## Why This Project Exists

A physical bike rental shop needs a fast, reliable digital tool for its staff to manage daily rentals. Previously,
paper-based or manual processes caused errors in billing and slow customer service. This UI bridges the gap between
the staff at the counter and the backend Bike Rental API.

The application is split into two modules because the admin and operator have fundamentally different needs:
- **Admin** works at a desk with a large monitor — needs dense data tables, bulk management, full CRUD forms.
- **Operator** works on the move with a phone — needs fast taps, QR scanning, minimal typing.

## Problems It Solves

| Problem | Solution |
|---|---|
| Slow customer lookup | Partial phone search (4+ digits) returning instant results |
| Manual tariff calculation | Auto-tariff selection based on equipment type + duration |
| Billing errors on return | Automatic overtime calculation with forgiveness logic |
| Equipment identification | QR code scanning via phone camera to read equipment UID |
| Lost revenue on disputes | Clear cost breakdown shown at return |
| Refund confusion | Explicit early-return rule (< 10 min = full refund) |
| Unauthorized access | JWT Bearer token auth with role-based route guards |
| Language barriers | i18n support with Russian as default language |

## How It Should Work

### Authentication Flow

```
User opens app
    → Redirect to /login if not authenticated
    → Enter username + password
    → Receive JWT token (mock for now, real endpoint later)
    → Redirect to /admin or /operator based on role
    → Token attached to all API requests via interceptor
    → 401 response → auto-logout → redirect to /login
```

### Admin Workflow (Desktop, ≥22" 1080p)

```
Admin logs in → lands on /admin/equipment
    → Sidebar navigation to all sections:
       - Equipment: paginated table, filters by status/type, create/edit dialog
       - Equipment Types: list + create/edit dialog
       - Equipment Statuses: list + create/edit dialog (with transition multi-select)
       - Tariffs: paginated table, create/edit dialog, activate/deactivate toggle
       - Customers: phone search + edit dialog
       - Rentals: paginated history table with filters
       - Payments: search by rental ID, payment list
       - Users: placeholder page (API coming later)
```

### Operator Workflow (Mobile, phone screen)

```
Operator logs in → lands on /operator/dashboard (active rentals)
    → Bottom navigation: Dashboard | New Rental | Return

New Rental (multi-step stepper):
    Step 1: Search customer by phone → select or create new
    Step 2: Enter equipment UID manually or scan QR code with camera
    Step 3: Select duration (30 min / 1 h / 2 h / day) → auto-tariff displayed
    Step 4: Select payment method, confirm amount → start rental

Return:
    → Camera opens for QR scan (or manual UID input)
    → System finds active rental for equipment
    → Shows cost breakdown (actual time, overtime, forgiveness)
    → If additional payment needed → collect and confirm
    → If early return (< 10 min) → show refund message
    → Close rental
```

## User Experience Goals

- **Speed**: Complete a new rental in under 60 seconds on a phone
- **Clarity**: Always show current rental status and cost estimate
- **Mobile-optimized**: Operator module designed for phone screen first
- **Desktop-optimized**: Admin module designed for large monitor (≥22" 1080p)
- **Error prevention**: Confirm actions that charge or refund money
- **Minimal training**: Self-explanatory UI for new operators
- **Accessible**: i18n ready, Russian as default language
- **Secure**: JWT auth, role-based guards, auto-logout on token expiry

## Target Users

| Role | Device | Primary Tasks |
|---|---|---|
| **Admin** | Desktop (≥22" 1080p) | Manage equipment, types, statuses, tariffs, customers, view history |
| **Operator** | Mobile phone | Create rentals, return equipment via QR scan, collect payments |

## Key API Integration

Backend: `http://localhost:8080` — Bike Rental API (Spring Boot)

Main domains consumed:
- `Customers` — search by phone, create, update
- `Equipment` — search, lookup by UID/serial/ID, create, update
- `Equipment Types` — get all, create, update
- `Equipment Statuses` — get all, create, update
- `Rentals` — create (fast path + draft), update (JSON Patch), return, search, get by ID, prepayment
- `Tariffs` — get all, get active, select, create, update, activate, deactivate
- `Finance` — record payment, get by ID, get by rental

