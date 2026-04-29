# Task 001: Add i18n Labels for Create Customer Dialog

> **Applied Skill:** `angular-component` — All visible text must use `$localize`; labels belong in `Labels` class

## 1. Objective

Add two new label constants to the shared `Labels` class: the "New Customer" button text used in `CustomerListComponent` and the error snackbar message shown by `CustomerCreateDialogComponent` on HTTP failure.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No new imports needed — file already uses $localize
```

**Code to Add/Replace:**

* **Location:** Inside the `Labels` class, directly after the line `static readonly CustomerSaveError = $localize\`Failed to save customer profile\`;` (which is the last existing customer-profile label, around line ~140).

* **Snippet:**

```typescript
  static readonly
CustomerNewButton = $localize`New Customer`;
static readonly
CustomerCreateError = $localize`Failed to create customer`;
```

The two lines must be inserted so the full block reads:

```typescript
  static readonly
CustomerSaveSuccess = $localize`Customer profile saved`;
static readonly
CustomerSaveError = $localize`Failed to save customer profile`;

static readonly
CustomerNewButton = $localize`New Customer`;
static readonly
CustomerCreateError = $localize`Failed to create customer`;

static readonly
CustomerRentalsTabLabel = $localize`Rentals`;
```

## 4. Validation Steps

```bash
npm run build -- --project shared
```
