# Initial User Request — Customer Section

## Original Request

Design and implement the Customer section of the frontend application.

### General Requirements

- All screens must be fully responsive — one Angular component per screen, adapting to mobile, tablet, and desktop
- Mobile-first approach: operators primarily work from phones
- Use Angular Material components throughout (mat-table, mat-tabs, mat-form-field, mat-button, mat-card, etc.)
- Use Angular Router for navigation; routes should be deep-linkable:
  - `/customers` — customer list
  - `/customers/:id` — customer detail (default tab: Profile)
  - `/customers/:id/rentals` — Rentals tab
  - `/customers/:id/account` — Account tab
  - `/customers/:id/transactions` — Transactions tab

### Page 1: Customer List (`/customers`)

- Display customers in a responsive list (cards on mobile, table on desktop)
- Columns/fields shown: phone number (primary), first name, last name
- Search input to filter by phone or name (client-side or via API query param)
- Clicking a row/card navigates to `/customers/:id`

### Page 2: Customer Detail (`/customers/:id`)

- A "Back" button always visible — navigates back to `/customers`
- Header area shows: phone number, first name + last name (if present)
- Tab navigation using mat-tab-group:
  - On mobile: scrollable tab strip (`[mat-stretch-tabs]="false"`)
  - On desktop: standard tab bar
- Tabs: Profile, Rentals, Account, Transactions
- Active tab reflected in the URL and preserved on reload

#### Tab: Profile

- Display fields: phone (required), first name, last name, date of birth, notes — all optional except phone
- No status field
- Edit mode: toggle between view and edit state within the same component
- In edit mode: show Save and Cancel buttons
- On Save: call PATCH /customers/:id, show success/error feedback via MatSnackBar

#### Tab: Rentals

- Read-only list of rentals
- Each rental contains multiple equipment items; each item has its own return status
- Show per rental: date, equipment items with individual return status (returned / active)
- Visually distinguish fully returned rentals from partially or fully active ones
- "New Rental" button — visible and styled as a primary action, but disabled or shows a "coming soon" snackbar on click (stub)

#### Tab: Account

- Show two read-only fields: Available balance, Reserved balance
- "Top Up" button opens a MatDialog with an amount input (positive numbers only)
- On confirm: call POST /customers/:id/top-up, refresh balance, show snackbar feedback
- Reserved balance is display-only — no editing

#### Tab: Transactions

- Read-only list: date, description, amount
- Positive amounts styled in green, negative in red/warn color

### Component Structure

```
customers/
  customers-list/
    customers-list.component.ts
  customer-detail/
    customer-detail.component.ts         ← shell with tabs + back button
    tabs/
      customer-profile/
      customer-rentals/
      customer-account/
      customer-transactions/
  dialogs/
    top-up-dialog/
```

### Out of Scope

- Authentication and authorization
- Customer blocking or status fields
- Creating or editing rentals
- Financial reporting (totals, aggregates)
- Customer self-service

---

## Clarifications Gathered

| Question                        | Answer                                                                              |
|---------------------------------|-------------------------------------------------------------------------------------|
| Target app?                     | Admin — replace the existing stub                                                   |
| Rentals tab detail level?       | Simplified summary list; click to expand and show equipment items + per-item status |
| Top Up dialog — payment method? | Include payment method selector                                                     |
| Profile save — PUT or PATCH?    | Keep PUT (full replace, as generated)                                               |
| Transaction item fields?        | `recordedAt`, `amount`, `description`, `sourceType`                                 |
