# Task 004: Customer i18n Labels

> **Applied Skills:** `angular-component` — project rule: all visible text must use `$localize`; never raw string literals in templates or TS.

## 1. Objective

Add all customer-section label constants to `labels.ts` so every downstream component (list, shell, profile, rentals, account, transactions, dialogs) can import a named constant instead of an inline string.

## 2. File to Modify

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File — append a new `Customer` namespace block at the end of the existing `Labels` namespace.

## 3. Code Implementation

**Imports Required:** None — file already uses `$localize`.

**Code to Add:**

* **Location:** Inside the existing `export namespace Labels { ... }` block, append after the last existing entry.

```typescript
  // ── Customer Section ──────────────────────────────────────────────────────

  export const CustomersTitle = $localize`Customers`;
  export const CustomerSearchPlaceholder = $localize`Search by phone`;
  export const CustomerEmptyState = $localize`No customers found`;
  export const CustomerBackButton = $localize`Back to customers`;

  // Detail shell header
  export const CustomerBalanceAvailable = $localize`Available`;
  export const CustomerBalanceReserved = $localize`Reserved`;

  // Profile tab
  export const CustomerProfileTabLabel = $localize`Profile`;
  export const CustomerPhoneLabel = $localize`Phone`;
  export const CustomerFirstNameLabel = $localize`First name`;
  export const CustomerLastNameLabel = $localize`Last name`;
  export const CustomerEmailLabel = $localize`Email`;
  export const CustomerBirthDateLabel = $localize`Date of birth`;
  export const CustomerNotesLabel = $localize`Notes`;
  export const CustomerEditButton = $localize`Edit`;
  export const CustomerSaveSuccess = $localize`Customer profile saved`;
  export const CustomerSaveError = $localize`Failed to save customer profile`;

  // Rentals tab
  export const CustomerRentalsTabLabel = $localize`Rentals`;
  export const CustomerRentalsEmptyState = $localize`No rentals found`;
  export const CustomerNewRentalButton = $localize`New rental`;
  export const CustomerNewRentalComingSoon = $localize`New rental feature coming soon`;
  export const CustomerRentalLoadError = $localize`Failed to load rentals`;
  export const CustomerRentalDetailLoadError = $localize`Failed to load rental details`;

  // Rental status labels
  export const RentalStatusDraft = $localize`Draft`;
  export const RentalStatusActive = $localize`Active`;
  export const RentalStatusCompleted = $localize`Completed`;
  export const RentalStatusCancelled = $localize`Cancelled`;
  export const RentalStatusDebt = $localize`Debt`;

  // Equipment item status labels
  export const EquipmentItemStatusAssigned = $localize`Assigned`;
  export const EquipmentItemStatusActive = $localize`In use`;
  export const EquipmentItemStatusReturned = $localize`Returned`;

  // Account tab
  export const CustomerAccountTabLabel = $localize`Account`;
  export const CustomerTopUpButton = $localize`Top Up`;
  export const CustomerWithdrawButton = $localize`Withdraw`;
  export const CustomerTopUpSuccess = $localize`Balance topped up successfully`;
  export const CustomerWithdrawSuccess = $localize`Withdrawal recorded successfully`;
  export const CustomerBalanceLoadError = $localize`Failed to load balance`;

  // Top-up dialog
  export const TopUpDialogTitle = $localize`Top Up`;
  export const TopUpAmountLabel = $localize`Amount`;
  export const TopUpPaymentMethodLabel = $localize`Payment method`;
  export const TopUpConfirmButton = $localize`Confirm`;
  export const TopUpError = $localize`Top up failed. Please try again.`;

  // Withdraw dialog
  export const WithdrawDialogTitle = $localize`Withdraw`;
  export const WithdrawAmountLabel = $localize`Amount`;
  export const WithdrawPaymentMethodLabel = $localize`Payout method`;
  export const WithdrawAvailableHint = $localize`Available`;
  export const WithdrawConfirmButton = $localize`Confirm`;
  export const WithdrawError = $localize`Withdrawal failed. Please try again.`;

  // Payment methods
  export const PaymentMethodCash = $localize`Cash`;
  export const PaymentMethodBankTransfer = $localize`Bank transfer`;
  export const PaymentMethodCardTerminal = $localize`Card terminal`;

  // Transactions tab
  export const CustomerTransactionsTabLabel = $localize`Transactions`;
  export const CustomerTransactionsEmptyState = $localize`No transactions found`;
  export const CustomerTransactionsLoadError = $localize`Failed to load transactions`;
  export const TransactionAmountLabel = $localize`Amount`;
  export const TransactionDateLabel = $localize`Date`;
  export const TransactionDescriptionLabel = $localize`Description`;
  export const TransactionTypeLabel = $localize`Type`;

  export const SaveButton = $localize`Save`;
  export const CancelButton = $localize`Cancel`;
```

## 4. Validation Steps

```bash
npm run i18n:extract
```

Confirm no `$localize` compilation errors appear. The command will update `src/locale/messages.xlf` with the new message IDs.
