// This class is used to keep labels to be translated
// the rule of usage is:
// 1. case of constant name depends on the storing value
// 2. any signs or spaces are omitted
//  Ex. Save = $localize`Save`;
//      save = $localize`save`;
//      CreateStatus = $localize`Create Status`;
//
export class Labels {
  static readonly Save = $localize`Save`;
  static readonly Saving = $localize`Saving...`;
  static readonly Loading = $localize`Loading...`;
  static readonly Cancel = $localize`Cancel`;
  static readonly Description = $localize`Description`;
  static readonly Name = $localize`Name`;
  static readonly Slug = $localize`Slug`;
  static readonly Close = $localize`Close`;
  static readonly Edit = $localize`Edit`;
  static readonly Create = $localize`Create`;

  static readonly SerialNumber = $localize`Serial Number`;
  static readonly Uid = $localize`UID`;
  static readonly Type = $localize`Type`;
  static readonly Status = $localize`Status`;
  static readonly Model = $localize`Model`;
  static readonly CommissionedAt = $localize`Commissioned`; // keep singular label used in templates
  static readonly Condition = $localize`Condition`;
  static readonly ConditionNotes = $localize`Condition Notes`;
  static readonly CreateEquipment = $localize`Create Equipment`;
  static readonly EditEquipment = $localize`Edit Equipment`;
  static readonly FormatDate = $localize`Format Date:`;
  // Added for equipment list
  static readonly Equipment = $localize`Equipment`;
  static readonly SelectAll = $localize`Select all`;
  static readonly Deselect = $localize`Deselect`;
  static readonly All = $localize`All`;
  static readonly Activate = $localize`Activate`;
  static readonly Deactivate = $localize`Deactivate`;
  static readonly StatusChanged = $localize`Status changed`;
  static readonly ErrorOccurred = $localize`Error occurred`;
  static readonly Tariff = $localize`Tariff`;
  static readonly Tariffs = $localize`Tariffs`;
  static readonly TariffsEmptyState = $localize`No tariffs found`;
  static readonly CreateTariff = $localize`Create Tariff`;
  static readonly EditTariff = $localize`Edit Tariff`;
  static readonly PricingType = $localize`Pricing Type`;
  static readonly PricingTypeTitles: Record<string, string> = {
    DEGRESSIVE_HOURLY: $localize`Degressive hourly`,
    FLAT_HOURLY: $localize`Flat hourly`,
    DAILY: $localize`Daily`,
    FLAT_FEE: $localize`Flat fee`,
    SPECIAL: $localize`Special`,
  };

  static readonly PricingTypeDescriptions: Record<string, string> = {
    DEGRESSIVE_HOURLY: $localize`Price decreases over time after the first hour, with configurable minimums.`,
    FLAT_HOURLY: $localize`Flat hourly rate charged for each started hour.`,
    DAILY: $localize`Daily rate with additional overtime hourly charge for extra time.`,
    FLAT_FEE: $localize`One-time flat fee for issuance with optional minimum duration surcharge.`,
    SPECIAL: $localize`Special pricing rules; parameters not required or are configured elsewhere.`,
  };
  static readonly ValidFrom = $localize`Valid From`;
  static readonly ValidTo = $localize`Valid To`;
  static readonly NoEndDate = $localize`No end date`;
  static readonly EquipmentType = $localize`Equipment Type`;
  static readonly Saved = $localize`Saved`;
  static readonly EquipmentTypesPageTitle = $localize`Equipment types`;
  static readonly NavigateToHomeAria = $localize`Navigate to home`;

  static readonly FirstHourPrice = $localize`First Hour Price`;
  static readonly HourlyDiscount = $localize`Hourly Discount`;
  static readonly MinimumHourlyPrice = $localize`Minimum Hourly Price`;
  static readonly HourlyPrice = $localize`Hourly Price`;
  static readonly DailyPrice = $localize`Daily Price`;
  static readonly OvertimeHourlyPrice = $localize`Overtime Hourly Price`;
  static readonly IssuanceFee = $localize`Issuance Fee`;
  static readonly MinimumDurationMinutes = $localize`Minimum Duration (min)`;
  static readonly MinimumDurationSurcharge = $localize`Minimum Duration Surcharge`;
  static readonly NoAdditionalParams = $localize`No additional parameters required`;

  static readonly Customers = $localize`Customers`;
  static readonly CreateCustomer = $localize`Create Customer`;
  static readonly EditCustomer = $localize`Edit Customer`;
  static readonly Phone = $localize`Phone`;
  static readonly FirstName = $localize`First Name`;
  static readonly LastName = $localize`Last Name`;
  static readonly Email = $localize`Email`;
  static readonly BirthDate = $localize`Birth Date`;
  static readonly Comments = $localize`Comments`;
  static readonly SearchByPhone = $localize`Search customer by phone (min. 4 digits)`;
  static readonly CustomersNotFound = $localize`No customers found`;

  static readonly RentalHistory = $localize`Rental History`;
  static readonly RentalId = $localize`Rental ID`;
  static readonly CustomerId = $localize`Customer ID`;
  static readonly EquipmentUid = $localize`Equipment UID`;
  static readonly StartedAt = $localize`Started At`;
  static readonly ExpectedReturn = $localize`Expected Return`;
  static readonly OverdueMinutes = $localize`Overdue (min)`;
  static readonly EditRental = $localize`Edit Rental`;

  static readonly PaymentHistory = $localize`Payment History`;
  static readonly SearchByRentalId = $localize`Search by Rental ID`;
  static readonly Amount = $localize`Amount`;
  static readonly PaymentType = $localize`Payment Type`;
  static readonly PaymentMethod = $localize`Payment Method`;
  static readonly Operator = $localize`Operator`;
  static readonly ReceiptNumber = $localize`Receipt Number`;
  static readonly CreatedAt = $localize`Created At`;
  static readonly Search = $localize`Search`;
  static readonly PaymentsNotFound = $localize`No payments found`;

  static readonly Users = $localize`Users`;
  static readonly Username = $localize`Username`;
  static readonly Role = $localize`Role`;
  static readonly UsersPlaceholderMessage = $localize`User management will be available after the authorization API is implemented.`;

  static readonly CustomersTitle = $localize`Customers`;
  static readonly CustomerSearchPlaceholder = $localize`Search by phone`;
  static readonly CustomerSearchInputPlaceholder = $localize`Enter 4 numbers of phone`;
  static readonly CustomerEmptyState = $localize`No customers found`;
  static readonly CustomerBackButton = $localize`Back to customers`;

  static readonly Available = $localize`Available`;
  static readonly BalanceAvailable = $localize`Balance Available`;
  static readonly CustomerBalanceReserved = $localize`Reserved`;
  static readonly ReservedInitially = $localize`Reserved initially`;
  static readonly FinanceShop = $localize`Shop`;
  static readonly FinanceExternal = $localize`External`;

  static readonly CustomerCommentsTitle = $localize`Operator comments`;
  static readonly CustomerNoComments = $localize`No comments yet`;

  static readonly ReservedTransactionsEmpty = $localize`No transactions for this rental yet`;
  static readonly CustomerOpenProfile = $localize`Open full profile`;

  static readonly CustomerProfileTabLabel = $localize`Profile`;
  static readonly CustomerPhoneLabel = $localize`Phone`;
  static readonly PhoneFormatHint = $localize`Example: digits only, e.g. +375291234567`;
  static readonly CustomerFirstNameLabel = $localize`First name`;
  static readonly CustomerLastNameLabel = $localize`Last name`;
  static readonly CustomerEmailLabel = $localize`Email`;
  static readonly CustomerBirthDateLabel = $localize`Date of birth`;
  static readonly CustomerNotesLabel = $localize`Notes`;
  static readonly CustomerEditButton = $localize`Edit`;
  static readonly CustomerSaveSuccess = $localize`Customer profile saved`;
  static readonly CustomerSaveError = $localize`Failed to save customer profile`;

  static readonly CustomerNewButton = $localize`New Customer`;
  static readonly CustomerCreateError = $localize`Failed to create customer`;

  static readonly CustomerRentalsTabLabel = $localize`Rentals`;
  static readonly CustomerRentalsEmptyState = $localize`No rentals found`;
  static readonly CustomerRentalsEmptyFiltered = $localize`No rentals match the selected dates`;
  static readonly CustomerRentalsResetFilter = $localize`Reset filter`;
  static readonly CustomerRentalsFilterFrom = $localize`From`;
  static readonly CustomerRentalsFilterTo = $localize`To`;
  static readonly CustomerRentalsFilterClear = $localize`Clear date filter`;
  static readonly CustomerRentalsFilterToggle = $localize`Filters`;
  static readonly CustomerRentalsFilterActive = $localize`active`;
  static readonly CustomerRentalsViewDetails = $localize`View rental details`;
  static readonly CustomerRentalsEquipmentFallback = $localize`Equipment`;
  static readonly CustomerRentalsCostEstimated = $localize`Estimated`;
  static readonly CustomerRentalsCostNotBilled = $localize`Not billed`;
  static readonly CustomerRentalLoadError = $localize`Failed to load rentals`;
  static readonly CustomerRentalDetailLoadError = $localize`Failed to load rental details`;
  static readonly RentalDraftLoadError = $localize`Failed to load rental draft. Starting fresh.`;

  static readonly RentalStatusDraft = $localize`Draft`;
  static readonly RentalStatusActive = $localize`Active`;
  static readonly RentalStatusCompleted = $localize`Completed`;
  static readonly RentalStatusCancelled = $localize`Cancelled`;
  static readonly RentalStatusDebt = $localize`Debt`;

  static readonly EquipmentItemStatusAssigned = $localize`Assigned`;
  static readonly EquipmentItemStatusActive = $localize`In use`;
  static readonly Rentals = $localize`Rentals`;
  static readonly TodaysHistory = $localize`History`;
  static readonly ActiveRentals = $localize`active rentals`;
  static readonly SortedByReturnTime = $localize`sorted by return time`;
  static readonly Refresh = $localize`Refresh`;
  static readonly FilterDrafts = $localize`Drafts`;
  static readonly Records = $localize`records`;
  static readonly NoActiveRentals = $localize`No active rentals`;
  static readonly OverdueBy = $localize`Overdue by`;
  static readonly Remaining = $localize`remaining`;
  static readonly Returned = $localize`Returned`;
  static readonly NoHistoryRentals = $localize`No rentals`;
  static readonly Ended = $localize`Ended`;
  static readonly ClearAllFilters = $localize`Clear all`;

  static readonly CustomerAccountTabLabel = $localize`Account`;
  static readonly CustomerTopUpButton = $localize`Top Up`;
  static readonly CustomerWithdrawButton = $localize`Withdraw`;
  static readonly CustomerTopUpSuccess = $localize`Balance topped up successfully`;
  static readonly CustomerWithdrawSuccess = $localize`Withdrawal recorded successfully`;
  static readonly CustomerBalanceLoadError = $localize`Failed to load balance`;

  static readonly TopUpDialogTitle = $localize`Top Up`;
  static readonly TopUpAmountLabel = $localize`Amount`;
  static readonly TopUpPaymentMethodLabel = $localize`Payment method`;
  static readonly TopUpConfirmButton = $localize`Confirm`;

  static readonly WithdrawDialogTitle = $localize`Withdraw`;
  static readonly WithdrawAmountLabel = $localize`Amount`;
  static readonly WithdrawPaymentMethodLabel = $localize`Payout method`;
  static readonly WithdrawAvailableHint = $localize`Available`;
  static readonly WithdrawConfirmButton = $localize`Confirm`;

  static readonly MoneyPointLabel = $localize`Rental point`;
  static readonly MoneyPointHint = $localize`The point where the money is received or paid out`;
  static readonly TransactionPointLabel = $localize`Rental point`;

  static readonly PaymentMethodCash = $localize`Cash`;
  static readonly PaymentMethodBankTransfer = $localize`Bank transfer`;
  static readonly PaymentMethodCardTerminal = $localize`Card terminal`;
  static readonly PaymentMethodInternalTransfer = $localize`Internal`;

  static readonly CustomerTransactionsTabLabel = $localize`Transactions`;
  static readonly CustomerTransactionsEmptyState = $localize`No transactions found`;
  static readonly CustomerTransactionsLoadError = $localize`Failed to load transactions`;
  static readonly TransactionAmountLabel = $localize`Amount`;
  static readonly TransactionDateLabel = $localize`Date`;
  static readonly TransactionDescriptionLabel = $localize`Description`;
  static readonly TransactionTypeLabel = $localize`Type`;

  static readonly TransactionKindDeposit = $localize`Deposit`;
  static readonly TransactionKindWithdrawal = $localize`Withdrawal`;
  static readonly TransactionKindHold = $localize`Hold placed`;
  static readonly TransactionKindRelease = $localize`Hold released`;
  static readonly TransactionKindCapture = $localize`Charge`;
  static readonly TransactionKindRefund = $localize`Refund`;
  static readonly TransactionKindAdjustment = $localize`Adjustment`;
  static readonly TransactionKindPenalty = $localize`Penalty`;
  static readonly TransactionKindOther = $localize`Transaction`;

  // ── Admin Transactions ────────────────────────────────────────────────────

  static readonly TransactionsNavLabel = $localize`Transactions`;
  static readonly TransactionFilterLedgerTypes = $localize`Ledger`;
  static readonly TransactionFilterSourceId = $localize`Rental #`;

  static readonly LedgerTypeCash = $localize`Cash`;
  static readonly LedgerTypeCardTerminal = $localize`Card terminal`;
  static readonly LedgerTypeBankTransfer = $localize`Bank transfer`;
  static readonly LedgerTypeRevenue = $localize`Revenue`;
  static readonly LedgerTypeAdjustment = $localize`Adjustment`;
  static readonly LedgerTypeCustomerWallet = $localize`Customer wallet`;
  static readonly LedgerTypeCustomerHold = $localize`Customer hold`;

  static readonly TransactionDirectionCredit = $localize`Credit`;
  static readonly TransactionDirectionDebit = $localize`Debit`;

  static readonly TransactionDetailsTitle = $localize`Transaction details`;
  static readonly TransactionDetailsLoadError = $localize`Failed to load transaction details`;
  static readonly TransactionViewDetails = $localize`View transaction details`;
  static readonly TransactionIdLabel = $localize`Transaction ID`;
  static readonly TransactionReasonLabel = $localize`Reason`;
  static readonly TransactionDeltasTitle = $localize`Money movement`;
  static readonly TransactionBalancesTitle = $localize`Balances after`;
  static readonly TransactionEntriesTitle = $localize`Ledger entries`;
  static readonly TransactionCustomerLedgersTitle = $localize`Customer ledgers`;
  static readonly TransactionSystemLedgersTitle = $localize`System ledgers`;
  static readonly TransactionEntryLedgerColumn = $localize`Ledger`;
  static readonly TransactionEntryDirectionColumn = $localize`Direction`;
  static readonly TransactionEntrySignedDeltaColumn = $localize`Change`;
  static readonly TransactionEntryBalanceAfterColumn = $localize`Balance after`;

  static readonly Duration = $localize`Duration`;
  static readonly DurationMinutes = $localize`Duration (min)`;
  static readonly MinuteShort = $localize`min`;
  static readonly HourShort = $localize`h`;
  static readonly DayShort = $localize`d`;
  static readonly SearchEquipmentPlaceholder = $localize`Search by UID or model...`;
  static readonly ScanQr = $localize`Scan QR`;
  static readonly ComingSoon = $localize`Coming soon`;
  static readonly ScanEquipmentTitle = $localize`Scan equipment QR`;
  static readonly CameraPermissionDenied = $localize`Camera access was denied. Allow it in your browser settings or enter the UID manually.`;
  static readonly NoCameraFound = $localize`No camera found. Enter the UID manually.`;
  static readonly ScannerError = $localize`Could not start the scanner. Enter the UID manually.`;
  static readonly EquipmentNotAvailableOrNotFound = $localize`Equipment not available or not found`;
  static readonly EquipmentAlreadyAdded = $localize`Equipment already added`;
  static readonly EquipmentAdded = $localize`Equipment added`;
  static readonly ScanToReturn = $localize`Scan equipment QR`;
  static readonly EquipmentReturnPageTitle = $localize`Equipment Return`;
  static readonly ScanEquipmentToReturnTitle = $localize`Scan equipment to return`;
  static readonly NoActiveRentalForEquipment = $localize`No active or draft rental holds this equipment`;
  static readonly OpenActiveRentals = $localize`Open active rentals`;
  static readonly ReturnTabHomePoint = $localize`Home point`;
  static readonly ReturnTabOtherPoint = $localize`Other point`;
  static readonly ReturnLookupHint = $localize`Find the customer by phone or scan an item they bring back`;
  static readonly PickedUpAtOtherPoint = $localize`Picked up at another point:`;
  static readonly PickedUpAtThisPoint = $localize`Picked up at this point`;
  static readonly NoOpenRentalsForCustomer = $localize`This customer has no open rentals`;
  static readonly NoOpenRentalForScannedItem = $localize`No open rental holds this item`;
  static readonly DiscountPercent = $localize`Discount (%)`;
  static readonly SpecialPrice = $localize`Special Price`;
  static readonly FullPrice = $localize`Full price`;
  static readonly FixedPrice = $localize`Fixed price`;
  static readonly Fixed = $localize`Fixed`;
  static readonly TotalCost = $localize`Total Cost`;
  static readonly ChangePrice = $localize`Change price`;
  static readonly ChangePriceTitle = $localize`Change price`;
  static readonly ChangePriceSubtitle = $localize`Set a discount or a fixed price for this rental`;
  static readonly Update = $localize`Update`;
  static readonly NewTotal = $localize`New total`;
  static readonly ReturnedEquipment = $localize`Returned equipment`;
  static readonly PricingUpdateSuccess = $localize`Pricing updated`;
  static readonly SpecialTariffNotConfigured = $localize`No special tariff is configured. Ask an administrator to set one up.`;
  static readonly ProjectedBalance = $localize`Balance after payment`;
  static readonly InsufficientBalance = $localize`Insufficient balance`;
  static readonly SaveDraft = $localize`Save Draft`;
  static readonly Next = $localize`Next`;
  static readonly DraftSaved = $localize`Draft saved`;
  static readonly NoEquipmentSelected = $localize`Add at least one item to proceed`;
  static readonly NoAvailableEquipment = $localize`No available equipment`;

  static readonly Confirmation = $localize`Confirmation`;
  static readonly Back = $localize`Back`;
  static readonly TopUpBalance = $localize`Top Up Balance`;
  static readonly RentalSummary = $localize`Rental Summary`;
  static readonly BalanceShortfall = $localize`Shortfall`;
  static readonly CustomerName = $localize`Customer`;
  static readonly GoBack = $localize`Go back`;
  static readonly RentalPrefix = $localize`Rental #`;
  static readonly Expected = $localize`Expected`;
  static readonly DebtAutoCharge = $localize`Balance will be charged automatically once topped up`;
  static readonly Retry = $localize`Retry`;
  static readonly CurrentCost = $localize`Current cost`;
  static readonly FinalCost = $localize`Final cost`;
  static readonly PlannedCost = $localize`Planned cost`;
  static readonly ReturnPoint = $localize`Returned at point`;
  static readonly NotAvailable = $localize`NA`;
  static readonly InRentalSuffix = $localize`in rental`;
  static readonly PlannedDurationLabel = $localize`planned`;
  static readonly ApproxPricePrefix = $localize`≈`;
  static readonly FinalPricePrefix = $localize`=`;
  static readonly ReturnedAt = $localize`returned at`;
  static readonly ShowDetails = $localize`Show details`;
  static readonly CollapseDetails = $localize`Collapse`;
  static readonly Subtotal = $localize`Subtotal`;
  static readonly DiscountLabel = $localize`Discount`;
  static readonly Total = $localize`Total`;
  static readonly ReturnPricing = $localize`Return pricing`;
  static readonly ReturnButton = $localize`Return`;
  static readonly CalculateButton = $localize`Calculate`;
  static readonly CompleteRentalButton = $localize`Complete rental`;
  static readonly QuoteValidFor = $localize`Price valid for`;
  static readonly SecondsUnit = $localize`s`;
  static readonly BrokenEquipment = $localize`Broken`;
  static readonly CancelRental = $localize`Cancel rental`;
  static readonly KeepRental = $localize`Keep rental`;
  static readonly YesCancel = $localize`Yes, cancel`;
  static readonly CancelRentalConfirmation = $localize`Are you sure you want to cancel this rental?`;
  static readonly RentalReturnSuccess = $localize`Equipment returned successfully`;
  static readonly RentalCancelSuccess = $localize`Rental cancelled`;
  static readonly RentalReturnError = $localize`Failed to return equipment. Please try again.`;
  static readonly RentalCancelError = $localize`Failed to cancel rental. Please try again.`;

  static readonly WriteOffDebtButton = $localize`Write off`;
  static readonly WriteOffDebtDialogTitle = $localize`Write off this debt?`;
  static readonly WriteOffDebtDialogMessage = $localize`The outstanding shortfall will be written off and the rental will be closed. This cannot be undone.`;
  static readonly WriteOffDebtConfirmButton = $localize`Write off`;
  static readonly WriteOffDebtSuccess = $localize`Debt written off`;
  static readonly WrittenOffBadge = $localize`Written off`;

  static readonly ReturnDialogTitle = $localize`Confirm equipment return`;
  static readonly ItemsToReturn = $localize`Items to return`;
  static readonly EstimatedCost = $localize`Estimated cost`;
  static readonly TotalCurrent = $localize`Total current`;
  static readonly AmountToRefund = $localize`To refund to customer`;
  static readonly AmountToCollect = $localize`To collect from customer`;
  static readonly NoSettlementNeeded = $localize`No settlement needed`;
  static readonly ConfirmReturnButton = $localize`Confirm return`;

  static readonly AddEquipmentButton = $localize`Add equipment`;
  static readonly Add = $localize`Add`;
  static readonly AddEquipmentDialogTitle = $localize`Add equipment to rental`;
  static readonly AddEquipmentBillingNote = $localize`New items are billed only for the remaining time — the rental's return time does not change.`;
  static readonly RentalAddEquipmentSuccess = $localize`Equipment added to rental`;

  static readonly ReportDamageTitle = $localize`Report damage`;
  static readonly ReportDamageSubtitle = $localize`Select the affected items and describe what happened`;
  static readonly ReportDamageEquipmentLimitHint = $localize`Up to 5 items per report`;
  static readonly ReportDamageConditionLabel = $localize`New condition`;
  static readonly ReportDamageConditionBroken = $localize`Broken`;
  static readonly ReportDamageConditionMaintenance = $localize`Needs maintenance`;
  static readonly ReportDamageDescriptionLabel = $localize`What happened`;
  static readonly ReportDamageDescriptionPlaceholder = $localize`Describe the damage — this is recorded in the equipment's condition history`;
  static readonly ReportDamagePenaltyLabel = $localize`Penalty (optional)`;
  static readonly ReportDamageAvailabilityNote = $localize`Marking items broken or under maintenance removes them from the rentable pool immediately.`;
  static readonly ReportDamageSubmit = $localize`Submit report`;
  static readonly ReportDamageNoItemsSelected = $localize`Select at least one item`;
  static readonly DamageReportCreatedSuccess = $localize`Damage report created`;
  static readonly DamageReportPenaltyChargedSuccess = $localize`Damage report created — penalty charged`;
  static readonly DamageReportPenaltyPendingInfo = $localize`Damage report created. The penalty couldn't be collected yet — it will be charged automatically once the customer tops up.`;
  static readonly ItemsAlreadyReturned = $localize`items already returned`;
  static readonly Apply = $localize`Apply`;

  static readonly PenaltyStatusPending = $localize`Not collected yet`;
  static readonly PenaltyStatusSettled = $localize`Collected`;
  static readonly PenaltyAmountLabel = $localize`Penalty`;

  static readonly DamageReportsNavLabel = $localize`Damage reports`;
  static readonly DamageReportPrefix = $localize`Report #`;
  static readonly DamageReportDetailTitle = $localize`Broken`;
  static readonly DamageReportRentalWarning = $localize`This rental has damage reports`;
  static readonly DamageReportRentalWarningUnpaid = $localize`This rental has an uncollected penalty`;
  static readonly DamageReportLoadError = $localize`Failed to load the damage report`;
  static readonly DamageReportNotFound = $localize`Damage report not found`;
  static readonly DamageReportItemsTitle = $localize`Reported items`;
  static readonly DamageReportConditionChange = $localize`condition change`;
  static readonly DamageReportOperatorLabel = $localize`Reported by`;
  static readonly DamageReportPointLabel = $localize`Rental point`;
  static readonly DamageReportReportedAtLabel = $localize`Reported at`;
  static readonly DamageReportRentalLink = $localize`Open rental`;
  static readonly DamageReportCustomerLink = $localize`Open customer`;
  static readonly DamageReportNoPenalty = $localize`No penalty was charged`;

  static readonly CustomerPenaltiesTabLabel = $localize`Penalties`;
  static readonly CustomerPenaltiesEmptyState = $localize`No damage reports for this customer`;
  static readonly CustomerPenaltiesLoadError = $localize`Failed to load penalties`;
  static readonly CustomerPenaltiesRentalFilter = $localize`Rental #`;
  static readonly CustomerPenaltiesRentalFilterClear = $localize`Show all rentals`;

  static readonly DamageReportsListTitle = $localize`Damage reports`;
  static readonly DamageReportsEmptyState = $localize`No damage reports found`;
  static readonly DamageReportsLoadError = $localize`Failed to load damage reports`;
  static readonly DamageReportFilterEquipmentId = $localize`Equipment ID`;
  static readonly DamageReportFilterRentalId = $localize`Rental ID`;
  static readonly DamageReportFilterCustomerId = $localize`Customer ID`;
  static readonly DamageReportFilterPenaltyStatus = $localize`Penalty status`;
  static readonly DamageReportFilterOutstandingOnly = $localize`Outstanding only`;
  static readonly DamageReportColumnId = $localize`ID`;
  static readonly DamageReportColumnReportedAt = $localize`Reported at`;
  static readonly DamageReportColumnRental = $localize`Rental`;
  static readonly DamageReportColumnPoint = $localize`Point`;
  static readonly DamageReportColumnCustomer = $localize`Customer`;
  static readonly DamageReportColumnDescription = $localize`Description`;
  static readonly DamageReportColumnPenalty = $localize`Penalty`;
  static readonly DamageReportColumnStatus = $localize`Status`;

  static readonly TimeTravelDialogTitle = $localize`Server Time`;
  static readonly TimeTravelReset = $localize`Reset`;

  static readonly PwaUpdateReload = $localize`Reload`;
  static readonly PwaUpdateLater = $localize`Later`;
  static readonly PwaUpdateTitle = $localize`Update available`;
  static readonly PwaUpdateMessage = $localize`A new version of the app is ready. Reload to continue with the latest version.`;
  static readonly PwaUpdateFailed = $localize`Could not apply the update. Please reload the page.`;
  static readonly PwaUnrecoverableTitle = $localize`App needs to be reloaded`;
  static readonly PwaUnrecoverableMessage = $localize`The app could not load part of itself and needs to be reloaded to keep working.`;

  // Authentication
  static readonly Logout = $localize`Logout`;
  static readonly ChangePasswordTitle = $localize`Change your password`;
  static readonly ChangePasswordSubtitle = $localize`Your password must be updated before you can continue.`;
  static readonly CurrentPassword = $localize`Current password`;
  static readonly NewPassword = $localize`New password`;
  static readonly ConfirmPassword = $localize`Confirm new password`;
  static readonly ChangePasswordCta = $localize`Update password`;
  static readonly PasswordChanged = $localize`Password updated`;
  static readonly AccessDeniedTitle = $localize`Access denied`;
  static readonly AccessDeniedDetail = $localize`You do not have permission to view this page.`;
  static readonly BackToHome = $localize`Back to home`;

  // ── Health Indicator ──────────────────────────────────────────────────────

  static readonly HealthIndicatorStatusApiLabel = $localize`status API:`;

  // ── Profile & Settings ────────────────────────────────────────────────────

  static readonly AccountMenuAria = $localize`Account menu`;
  static readonly ProfileSettingsNav = $localize`Profile settings`;
  static readonly ProfileSaved = $localize`Profile saved`;
  static readonly ProfileAccountTab = $localize`Profile`;
  static readonly ProfileSecurityTab = $localize`Security`;
  static readonly ProfilePreferencesTab = $localize`Preferences`;
  static readonly ProfileConnectedTab = $localize`Connected accounts`;
  static readonly ProfileUploadPhoto = $localize`Upload photo`;
  static readonly ProfileLanguageLabel = $localize`Language`;
  static readonly ProfileLanguageEnglish = $localize`English`;
  static readonly ProfileLanguageRussian = $localize`Russian`;
  static readonly ProfileAppVersion = $localize`App version`;
  static readonly ProfileGoogleTitle = $localize`Google`;
  static readonly ProfileNotConnected = $localize`Not connected`;
  static readonly ProfileGoogleConnect = $localize`Connect`;

  // ── User Management ───────────────────────────────────────────────────────

  static readonly UsersListTitle = $localize`Users`;
  static readonly NewUserButton = $localize`New User`;
  static readonly UsersEmptyState = $localize`No users found`;
  static readonly UsersLoadError = $localize`Failed to load users`;
  static readonly UserColumnUsername = $localize`Username`;
  static readonly UserColumnEmail = $localize`Email`;
  static readonly UserColumnDisplayName = $localize`Display name`;
  static readonly UserColumnRoles = $localize`Roles`;
  static readonly UserColumnStatus = $localize`Status`;
  static readonly UserColumnLastLogin = $localize`Last login`;
  static readonly UserColumnActions = $localize`Actions`;
  static readonly UserStatusActive = $localize`Active`;
  static readonly UserStatusDisabled = $localize`Disabled`;
  static readonly UserLastLoginNever = $localize`Never`;
  static readonly UserEditTooltip = $localize`Edit`;
  static readonly UserResetPasswordTooltip = $localize`Reset password`;
  static readonly UserActivateTooltip = $localize`Activate`;
  static readonly UserDeactivateTooltip = $localize`Deactivate`;
  static readonly UserProtectedTooltip = $localize`This is a protected system account and cannot be modified here`;

  static readonly CreateUserDialogTitle = $localize`New User`;
  static readonly UserUsernameLabel = $localize`Username`;
  static readonly UserEmailLabel = $localize`Email`;
  static readonly UserDisplayNameLabel = $localize`Display name`;
  static readonly UserRolesLabel = $localize`Roles`;
  static readonly UserPasswordLabel = $localize`Password (optional)`;
  static readonly UserPasswordHint = $localize`Leave blank to auto-generate a temporary password`;
  static readonly CreateUserConfirmButton = $localize`Create`;
  static readonly CreateUserSuccessNoReveal = $localize`User created successfully`;
  static readonly CreateUserError = $localize`Failed to create user`;

  static readonly EditUserDialogTitle = $localize`Edit User`;
  static readonly UserStatusLabel = $localize`Status`;
  static readonly SaveUserButton = $localize`Save`;
  static readonly EditUserError = $localize`Failed to update user`;

  static readonly DeactivateUserDialogTitle = $localize`Deactivate user`;
  static readonly DeactivateUserDialogMessage = $localize`This will disable the account and revoke all of its active sessions. The user will no longer be able to sign in until reactivated.`;
  static readonly DeactivateUserConfirmButton = $localize`Deactivate`;
  static readonly DeactivateUserError = $localize`Failed to deactivate user`;
  static readonly ActivateUserError = $localize`Failed to activate user`;

  static readonly ResetPasswordDialogTitle = $localize`Reset password`;
  static readonly ResetPasswordDialogMessage = $localize`This will issue a new temporary password, force the user to change it at next login, and revoke all of their active sessions.`;
  static readonly ResetPasswordConfirmButton = $localize`Reset password`;
  static readonly ResetPasswordError = $localize`Failed to reset password`;

  static readonly TemporaryPasswordDialogTitle = $localize`Temporary password`;
  static readonly TemporaryPasswordWarning = $localize`This password is shown only once and cannot be retrieved again. Copy it now and share it securely with the user.`;
  static readonly TemporaryPasswordCopyButton = $localize`Copy`;
  static readonly TemporaryPasswordCopiedConfirmation = $localize`Copied to clipboard`;
  static readonly TemporaryPasswordCopyFailed = $localize`Copy failed — select and copy the password manually`;
  static readonly TemporaryPasswordDoneButton = $localize`Done`;
  static readonly TemporaryPasswordShowButton = $localize`Show password`;
  static readonly TemporaryPasswordHideButton = $localize`Hide password`;

  static readonly AgreementsNavLabel = $localize`Agreements`;
  static readonly AgreementsListTitle = $localize`Agreement Templates`;
  static readonly NewTemplateButton = $localize`New template`;
  static readonly AgreementColumnVersion = $localize`Version`;
  static readonly AgreementColumnTitle = $localize`Title`;
  static readonly AgreementColumnStatus = $localize`Status`;
  static readonly AgreementColumnCreatedAt = $localize`Created`;
  static readonly AgreementColumnActivatedAt = $localize`Activated`;
  static readonly AgreementColumnDeactivatedAt = $localize`Deactivated`;
  static readonly AgreementColumnActions = $localize`Actions`;
  static readonly AgreementStatusDraft = $localize`Draft`;
  static readonly AgreementStatusActive = $localize`Active`;
  static readonly AgreementStatusDeactivated = $localize`Deactivated`;
  static readonly AgreementEmptyState = $localize`No agreement templates found`;

  static readonly AgreementEditTooltip = $localize`Edit`;
  static readonly AgreementViewTooltip = $localize`View`;
  static readonly AgreementActivateTooltip = $localize`Activate`;
  static readonly AgreementDeleteTooltip = $localize`Delete`;
  static readonly AgreementCopyTooltip = $localize`Copy`;
  static readonly AgreementCopySuccess = $localize`Template copied`;

  static readonly ActivateAgreementDialogTitle = $localize`Activate this template?`;
  static readonly ActivateAgreementDialogMessage = $localize`Activating this template will immediately deactivate the currently active version. Deactivated templates can never be edited or re-activated.`;
  static readonly ActivateAgreementConfirmButton = $localize`Activate`;
  static readonly ActivateAgreementSuccess = $localize`Template activated`;

  static readonly DeleteAgreementDialogTitle = $localize`Delete this template?`;
  static readonly DeleteAgreementDialogMessage = $localize`This draft template will be permanently deleted. This action cannot be undone.`;
  static readonly DeleteAgreementConfirmButton = $localize`Delete`;
  static readonly DeleteAgreementSuccess = $localize`Template deleted`;

  static readonly CreateAgreementDialogTitle = $localize`New Agreement Template`;
  static readonly EditAgreementDialogTitle = $localize`Edit Agreement Template`;
  static readonly ViewAgreementDialogTitle = $localize`Agreement Template`;
  static readonly AgreementTitleLabel = $localize`Title`;
  static readonly AgreementContentLabel = $localize`Content`;
  static readonly SaveAgreementSuccess = $localize`Template saved`;
  static readonly PreviewPdfButton = $localize`Preview PDF`;
  static readonly GeneratingPdfButton = $localize`Generating PDF...`;

  static readonly VariablesReferenceTitle = $localize`Available variables`;
  static readonly VariablesReferenceHint = $localize`Click a variable to insert it into the content at the cursor.`;
  static readonly VariablesReferenceEmpty = $localize`No variables available`;
  static readonly VariablesReferenceExampleLabel = $localize`Example`;

  static readonly AgreementPdfPreviewDialogTitle = $localize`PDF Preview`;
  static readonly AgreementPdfPreviewIframeTitle = $localize`Agreement PDF preview`;
  static readonly DownloadPdfButton = $localize`Download`;

  static readonly SignatureClear = $localize`Clear`;
  static readonly SignatureHint = $localize`Sign here`;

  static readonly SendToSigning = $localize`Send to signing`;
  static readonly AgreementSignedSuccess = $localize`Agreement signed — rental started`;
  static readonly RentalStatusAwaitingSignature = $localize`Awaiting signature`;
  static readonly SignatureStartNote = $localize`The rental starts at the moment of signing`;
  static readonly SignButton = $localize`Sign`;
  static readonly SigningDialogTitle = $localize`Rental Agreement`;
  static readonly AgreementSigned = $localize`Agreement signed`;
  static readonly AgreementVersion = $localize`version`;
  static readonly DownloadAgreementPdf = $localize`Download PDF`;
  static readonly AgreementPdf = $localize`Agreement PDF`;

  static readonly ConsentPrefix = $localize`I confirm that I have read and fully accept the terms of`;
  static readonly ConsentSuffix = $localize`(the "Agreement").`;
  static readonly ViewAgreement = $localize`View Agreement`;
  static readonly HideAgreement = $localize`Hide Agreement`;
  static readonly ConsentSignBelowNote = $localize`By signing below, I confirm that I have reviewed the safety rules for using the rented equipment described in the Agreement, agree to comply with them, and confirm that my signature constitutes my informed and voluntary acceptance of the Agreement.`;

  // ── Admin Analytics ─────────────────────────────────────────────────────

  static readonly AnalyticsNavLabel = $localize`Analytics`;
  static readonly AnalyticsPageTitle = $localize`Revenue Analytics`;
  static readonly AnalyticsRefreshButton = $localize`Refresh`;
  static readonly AnalyticsFreshnessNote = $localize`Figures are eventually consistent — a just-completed rental may take a few seconds to appear.`;
  static readonly AnalyticsEmptyState = $localize`No activity in the selected range`;
  static readonly AnalyticsLoadError = $localize`Failed to load the report`;

  static readonly AnalyticsOperatorsTab = $localize`By Operator`;
  static readonly AnalyticsOperatorFilterLabel = $localize`Operator`;
  static readonly AnalyticsAllOperatorsOption = $localize`All operators`;
  static readonly AnalyticsDimensionColumnOperator = $localize`Operator`;

  static readonly AnalyticsPointsTab = $localize`By Point`;
  static readonly AnalyticsPointFilterLabel = $localize`Rental point`;
  static readonly AnalyticsAllPointsOption = $localize`All points`;
  static readonly AnalyticsDimensionColumnPoint = $localize`Rental point`;

  static readonly AnalyticsEquipmentTypesTab = $localize`By Equipment Type`;
  static readonly AnalyticsEquipmentUnitsTab = $localize`By Unit`;
  static readonly AnalyticsEquipmentTypeFilterLabel = $localize`Equipment type`;
  static readonly AnalyticsAllEquipmentTypesOption = $localize`All equipment types`;
  static readonly AnalyticsEquipmentTypeScopeLabel = $localize`Equipment type`;
  static readonly AnalyticsDimensionColumnEquipmentType = $localize`Equipment type`;
  static readonly AnalyticsEquipmentUnitFilterLabel = $localize`Unit`;
  static readonly AnalyticsAllEquipmentUnitsOption = $localize`All units`;
  static readonly AnalyticsDimensionColumnEquipmentUnit = $localize`Unit`;
  static readonly AnalyticsSelectTypePrompt = $localize`Select an equipment type to see revenue per unit.`;
  static readonly AnalyticsUnattributedHintEquipment = $localize`Revenue whose equipment is unknown. Included in the totals but not in any row.`;
  static readonly AnalyticsDrillDownTooltip = $localize`View revenue per unit for this type`;

  static readonly AnalyticsGranularityLabel = $localize`Granularity`;
  static readonly AnalyticsGranularityDay = $localize`Day`;
  static readonly AnalyticsGranularityWeek = $localize`Week`;
  static readonly AnalyticsGranularityMonth = $localize`Month`;
  static readonly AnalyticsGranularityTotal = $localize`Total`;

  static readonly AnalyticsGroupRevenue = $localize`Revenue`;
  static readonly AnalyticsGroupForgone = $localize`Forgone`;
  static readonly AnalyticsGroupCashMovement = $localize`Cash movement`;

  static readonly AnalyticsMetricAccruedRentalRevenue = $localize`Accrued rental revenue`;
  static readonly AnalyticsMetricAccruedRentalRevenueHint = $localize`Revenue recognized as rentals run, regardless of payment status.`;
  static readonly AnalyticsMetricPaidRentalRevenue = $localize`Paid rental revenue`;
  static readonly AnalyticsMetricPaidRentalRevenueHint = $localize`The portion of accrued revenue actually collected from customers.`;
  static readonly AnalyticsMetricWrittenOffAmount = $localize`Written off`;
  static readonly AnalyticsMetricWrittenOffAmountHint = $localize`Revenue forgone via debt write-off. Not subtracted from accrued revenue.`;
  static readonly AnalyticsMetricPenaltyRevenue = $localize`Penalty revenue`;
  static readonly AnalyticsMetricPenaltyRevenueHint = $localize`Revenue from penalties charged to customers.`;
  static readonly AnalyticsMetricWalletDeposits = $localize`Wallet deposits`;
  static readonly AnalyticsMetricWalletDepositsHint = $localize`Cash moved into customer wallets. Not revenue.`;
  static readonly AnalyticsMetricWalletWithdrawals = $localize`Wallet withdrawals`;
  static readonly AnalyticsMetricWalletWithdrawalsHint = $localize`Cash moved out of customer wallets. Not revenue.`;

  static readonly AnalyticsMetricSelectorLabel = $localize`Chart metric`;
  static readonly AnalyticsBucketColumn = $localize`Period`;
  static readonly AnalyticsExpandBucketTooltip = $localize`Show breakdown`;
  static readonly AnalyticsUnattributedRow = $localize`Unattributed`;
  static readonly AnalyticsUnattributedHint = $localize`Revenue whose opening operator is unknown. Included in the totals but not in any operator row.`;

  static readonly AnalyticsCustomersTab = $localize`By Customer`;
  static readonly AnalyticsCustomerSummaryHeading = $localize`Customer summary`;
  static readonly AnalyticsCustomerListHeading = $localize`Top customers`;

  static readonly AnalyticsCustomerCountsGroupLabel = $localize`Customers`;
  static readonly AnalyticsCountActiveCustomers = $localize`Active customers`;
  static readonly AnalyticsCountActiveCustomersHint = $localize`Distinct customers with at least one money movement in the selected range. Never the sum of the per-period figures.`;
  static readonly AnalyticsCountNewCustomers = $localize`New customers`;
  static readonly AnalyticsCountNewCustomersHint = $localize`Customers registered within the selected range.`;
  static readonly AnalyticsCountRegisteredCustomers = $localize`Registered customers`;
  static readonly AnalyticsCountRegisteredCustomersHint = $localize`All customers registered as of the end of the range. Anchored to the end date, so reopening a past report never changes it.`;
  static readonly AnalyticsCustomerCountsOperatorNote = $localize`The operator filter narrows the money figures only — customer counts always cover the whole business.`;

  static readonly AnalyticsActiveCustomersSeriesLabel = $localize`Active customers`;
  static readonly AnalyticsBucketActiveCustomersHint = $localize`Distinct customers active in this period. Not additive across periods.`;

  static readonly AnalyticsCustomerColumn = $localize`Customer`;
  static readonly AnalyticsCustomersEmptyState = $localize`No customer had any money movement in the selected range`;
  static readonly AnalyticsCustomerListNote = $localize`Only customers with money movement in the range are listed. Registered but inactive customers appear in the counts above.`;
  static readonly AnalyticsCustomerReconciliationNote = $localize`Summed across all customers, each metric equals the grand total of the By Operator report for the same range.`;
  static readonly AnalyticsSortAscending = $localize`Sort ascending`;
  static readonly AnalyticsSortDescending = $localize`Sort descending`;
  static readonly AnalyticsCustomerDrillDownTooltip = $localize`See what this customer's money went on`;

  static readonly AnalyticsCustomerBreakdownTitle = $localize`Equipment breakdown`;
  static readonly AnalyticsBackToCustomers = $localize`Back to customers`;
  static readonly AnalyticsCustomerBreakdownEmptyState = $localize`This customer had no equipment activity in the selected range`;
  static readonly AnalyticsCustomerBreakdownNote = $localize`Written-off amounts and wallet movement have no equipment dimension and are not shown here.`;
  static readonly AnalyticsUnknownCustomer = $localize`Unknown customer`;

  static readonly RentalTitle = $localize`Rental`;
  static readonly OpenRental = $localize`Open rental`;
  static readonly OpenTransactionsList = $localize`Open transactions list`;
  static readonly OpenDamageReportsList = $localize`Open damage reports list`;
  static readonly Cost = $localize`Cost`;
  static readonly RentalDetailsTitle = $localize`Rental details`;
  static readonly RentalDetailsEmptyState = $localize`Select a rental from the list to see its details`;
  static readonly RentalDetailsLoadError = $localize`Failed to load rental details`;
  static readonly RentalDetailsPanelLabel = $localize`Rental details panel`;
  static readonly RentalOutstandingDebt = $localize`Outstanding debt`;
  static readonly RentalColumnId = $localize`Id`;
  static readonly RentalColumnCustomer = $localize`Customer`;
  static readonly RentalOpenCustomer = $localize`Open customer profile`;
  static readonly RentalTableLabel = $localize`Rentals table`;
  static readonly RentalSortBy = $localize`Sort by`;
  static readonly RentalTransactionsTitle = $localize`Transactions`;
  static readonly RentalTransactionsEmpty = $localize`No transactions for this rental`;
  static readonly RentalDamageReportsTitle = $localize`Damage and penalties`;
  static readonly RentalDamageReportsEmpty = $localize`No damage reports for this rental`;
  static readonly NoData = $localize`No data`;
  static readonly ShowAll = $localize`Show all`;
  static readonly ShowLess = $localize`Show less`;
  static readonly RentalPeriodLabel = $localize`Rental period`;

  static readonly Points = $localize`Rental points`;
  static readonly PointNew = $localize`New point`;
  static readonly PointsEmpty = $localize`No rental points yet`;
  static readonly PointRegisterTitle = $localize`Register rental point`;
  static readonly PointSlugHint = $localize`Cannot be changed after registration`;
  static readonly PointLocationTitle = $localize`Location and time zone`;
  static readonly PointTimeZoneHint = $localize`Filled in from the chosen city. You can choose another zone.`;
  static readonly PointLocationMissing = $localize`Location not set`;
  static readonly PointTimeZoneMissing = $localize`Time zone not set`;
  static readonly PointIncompleteNotice = $localize`This point has no location or time zone yet. Edit the point to complete them.`;
  static readonly PointColumnLocation = $localize`:points-table|Points table column header:Location`;
  static readonly GeoCountry = $localize`:geo picker:Country`;
  static readonly GeoCity = $localize`:geo picker:City`;
  static readonly GeoStreet = $localize`Street and building`;
  static readonly GeoTimeZone = $localize`:geo picker:Time zone`;
  static readonly GeoCountryFirstHint = $localize`Choose the country first`;
  static readonly GeoCityNewHint = $localize`Not in the list: this city will be added when you save`;
  static readonly GeoNoMatches = $localize`No matches`;
  static geoLocationUnknown(id: string): string {
    return $localize`Unknown location #${id}:id:`;
  }
  static readonly PointContactsTitle = $localize`Contacts`;
  static readonly PointPrimaryPhone = $localize`Primary phone`;
  static readonly PointAdditionalPhone = $localize`Additional phone`;
  static readonly PointStatusActive = $localize`Active`;
  static readonly PointStatusInactive = $localize`Inactive`;
  static readonly PointStatusClosed = $localize`Permanently closed`;
  static readonly PointActivate = $localize`Activate`;
  static readonly PointDeactivate = $localize`Deactivate`;
  static readonly PointClosePermanently = $localize`Close permanently`;
  static readonly PointCloseConfirmTitle = $localize`Close rental point permanently?`;
  static readonly PointCloseConfirmMessage = $localize`A permanently closed point cannot be reopened or edited. This action cannot be undone.`;
  static readonly PointClosedReadOnly = $localize`This point is permanently closed and can no longer be edited.`;
  static readonly PointClosedSuccess = $localize`Rental point closed permanently`;
  static readonly PointSaved = $localize`Rental point saved`;
  static readonly PointColumnPoint = $localize`:points-table|Points table column header:Point`;
  static readonly PointColumnStatus = $localize`Status`;
  static readonly PointColumnCash = $localize`Cash in drawer`;
  static readonly PointColumnTerminal = $localize`Terminal`;
  static readonly PointColumnBank = $localize`Bank`;
  static readonly PointSummaryCash = $localize`Cash across all drawers`;
  static readonly PointSummaryTerminal = $localize`On terminal accounts`;
  static readonly PointShowClosed = $localize`Show closed points`;
  static readonly PointsLoadFailed = $localize`Rental points could not be loaded`;
  static readonly PointMoneyUnavailable = $localize`Point balances are not available yet`;
  static readonly PointBackButton = $localize`Back to rental points`;
  static readonly PointNotFound = $localize`Rental point not found`;
  static readonly PointTabProfile = $localize`Profile`;
  static readonly PointTabCash = $localize`:Point detail tab|Point detail tab:Cash`;
  static readonly PointTabTransfers = $localize`Collections`;
  static readonly PointTabOperations = $localize`Operations`;
  static readonly PointTabResults = $localize`:Point detail tab|Point detail tab:Results`;
  static readonly PointResultRevenue = $localize`:Point result figure|Point result figure:Revenue`;
  static readonly PointResultCorrections = $localize`:Point result figure|Point result figure:Corrections`;
  static readonly PointResultTotal = $localize`:Point result figure|Point result figure:Result`;
  static readonly PointResultTotalHint = $localize`Revenue plus corrections`;
  static readonly PointResultCollections = $localize`:Point result figure|Point result figure:Cash collections`;
  static readonly PointResultTerminalSettlements = $localize`:Point result figure|Point result figure:Terminal settlements`;
  static readonly PointResultTransfersHint = $localize`Money moved to the bank; not part of the result`;
  static readonly PointResultsLoadFailed = $localize`Results could not be loaded`;
  static readonly PointMovementKindsLabel = $localize`Movement types`;
  static readonly PointMovementKindsAll = $localize`All types`;
  static readonly PointPositionCash = $localize`:Point money position|Point money position:Cash`;
  static readonly PointPositionTerminal = $localize`:Point money position:Terminal`;
  static readonly PointPositionBank = $localize`:Point money position:Bank`;
  static readonly PointMovementKindRentalPayment = $localize`Rental payment`;
  static readonly PointMovementKindCollection = $localize`Cash collection`;
  static readonly PointMovementKindTerminalSettlement = $localize`Terminal settlement`;
  static readonly PointMovementKindShiftDiscrepancy = $localize`Shift discrepancy`;
  static readonly PointMovementColumnDate = $localize`Date and time`;
  static readonly PointMovementColumnType = $localize`Type`;
  static readonly PointMovementColumnCustomer = $localize`Customer`;
  static readonly PointMovementColumnRecordedBy = $localize`Recorded by`;
  static readonly PointMovementColumnAmount = $localize`Amount`;
  static readonly PointMovementColumnBalance = $localize`Balance after`;
  static readonly PointMovementPositionLabel = $localize`Position`;
  static readonly PointMovementOrderLabel = $localize`Order`;
  static readonly PointMovementOrderNewest = $localize`Newest first`;
  static readonly PointMovementOrderOldest = $localize`Oldest first`;
  static readonly PointMovementsEmpty = $localize`No movements in this period`;
  static readonly PointMovementsLoadFailed = $localize`Movements could not be loaded`;
  static readonly PointTransfersEmpty = $localize`No collections or settlements in this period`;
  static readonly PointCashCardTitle = $localize`Cash drawer`;
  static readonly PointTerminalCardTitle = $localize`Terminal account`;
  static readonly PointBankCardTitle = $localize`Bank account`;
  static readonly PointShiftOpening = $localize`Shift opening`;
  static readonly PointShiftExpectedCash = $localize`Expected cash`;
  static readonly PointShiftNone = $localize`No shift is running`;
  static readonly PointShiftLoadFailed = $localize`The running shift could not be loaded`;
  static readonly PointShiftMovementsTitle = $localize`Shift cash movements`;
  static readonly PointShiftMovementsEmpty = $localize`No cash movements in this shift`;
  static readonly PointCollectCash = $localize`Collect cash`;
  static readonly PointCloseShift = $localize`Close shift`;
  static readonly PointRecordSettlement = $localize`Record settlement`;
  static readonly PointCollectionNotActiveHint = $localize`Cash can be collected only at an active point`;
  static readonly PointSettlementClosedHint = $localize`Settlements cannot be recorded at a permanently closed point`;
  static readonly OperatorNavCash = $localize`:Operator bottom navigation|Operator bottom navigation item:Cash`;
  static readonly OperatorHandInCash = $localize`Hand in cash`;
  static readonly OperatorHandInConfirmTitle = $localize`Hand in cash?`;
  static readonly OperatorHandInNote = $localize`Instant and cannot be cancelled — if it was a mistake, an administrator corrects it`;
  static readonly OperatorHandInConfirm = $localize`Hand in`;
  static readonly OperatorCashHandedIn = $localize`Cash handed in`;
  static readonly OperatorReceiptTime = $localize`Time`;
  static readonly OperatorReceiptRemaining = $localize`Remaining in drawer`;
  static readonly Done = $localize`Done`;
  static readonly ShiftClosureShiftRow = $localize`Shift`;
  static readonly ShiftClosureConfirmTitle = $localize`Close shift?`;
  static readonly ShiftClosureCounted = $localize`Counted amount`;
  static readonly ShiftClosureDifference = $localize`Difference`;
  static readonly ShiftClosureMatches = $localize`Matches`;
  static readonly ShiftClosureNote = $localize`A closed shift cannot be reopened`;
  static readonly ShiftClosureClosedAt = $localize`Closed at`;
  static readonly ShiftClosureAlreadyClosed = $localize`This shift is already closed`;
  static readonly ShowMore = $localize`Show more`;
  static readonly PointMoveSourceLabel = $localize`:point money move|Where the money leaves from:From`;
  static readonly PointMoveDestinationLabel = $localize`:point money move|Where the money goes to:To`;
  static readonly PointMoveBankAccount = $localize`Bank account`;
  static readonly PointMoveAmount = $localize`Amount`;
  static readonly PointMoveAvailable = $localize`Available`;
  static readonly PointMoveAll = $localize`:point money move|Fill the whole available amount:All`;
  static readonly PointMoveRemainingRow = $localize`Remaining`;
  static readonly PointMoveSettlementDate = $localize`Settlement date`;
  static readonly PointMoveContinue = $localize`Continue`;
  static readonly PointMoveConfirm = $localize`Confirm`;
  static readonly PointMoveConfirmCollectionTitle = $localize`Confirm cash collection`;
  static readonly PointMoveConfirmSettlementTitle = $localize`Confirm settlement`;
  static readonly PointMoveNote = $localize`This entry cannot be cancelled; a mistake is corrected by an adjustment.`;
  static readonly PointPeriodFrom = $localize`From`;
  static readonly PointPeriodTo = $localize`To`;
  static readonly UnknownUser = $localize`Unknown user`;
  static readonly CurrentPoint = $localize`Current rental point`;
  static readonly NoWorkingPoint = $localize`No working point assigned`;
  static readonly EquipmentPoint = $localize`Rental point`;
  static readonly EquipmentInTransit = $localize`In transit`;

  static readonly BusinessSettingsNavLabel = $localize`Business settings`;
  static readonly BusinessSettingsSubtitle = $localize`Rules and defaults that apply to the whole rental network`;
  static readonly BusinessSettingsTabSettings = $localize`:business settings tab:Settings`;
  static readonly BusinessSettingsTabHistory = $localize`Change history`;
  static readonly BusinessSettingsEmptyState = $localize`No business settings are available.`;
  static readonly BusinessSettingsLoadError = $localize`Business settings could not be loaded.`;
  static readonly BusinessSettingColumnSetting = $localize`:business setting column:Setting`;
  static readonly BusinessSettingColumnValue = $localize`Current value`;
  static readonly BusinessSettingColumnSource = $localize`:business setting column|Where the current value comes from:Source`;
  static readonly BusinessSettingColumnDefault = $localize`Default`;
  static readonly BusinessSettingColumnActions = $localize`:business setting column:Actions`;
  static readonly BusinessSettingSourceBusiness = $localize`Set by administrator`;
  static readonly BusinessSettingSourceDefault = $localize`:business setting source:Default`;
  static readonly BusinessSettingSourcePoint = $localize`:business setting source:Rental point`;
  static readonly BusinessSettingSourceDerived = $localize`:business setting source:From city`;
  static readonly BusinessSettingSourceNotDeclared = $localize`:business setting source:Not declared`;
  static readonly BusinessSettingEditTooltip = $localize`Change value`;
  static readonly BusinessSettingResetTooltip = $localize`Reset to default`;
  static readonly BusinessSettingHistoryTooltip = $localize`Show change history`;
  static readonly BusinessSettingDialogTitle = $localize`Change setting`;
  static readonly BusinessSettingValueLabel = $localize`:business setting:New value`;
  static readonly BusinessSettingCurrentValue = $localize`:business setting:Current value`;
  static readonly BusinessSettingDefaultValue = $localize`Default value`;
  static readonly BusinessSettingRulesTitle = $localize`Rules`;
  static readonly BusinessSettingNoRules = $localize`No additional rules`;
  static readonly BusinessSettingSaveSuccess = $localize`Setting saved`;
  static readonly BusinessSettingUnsupported = $localize`This kind of setting cannot be edited in this version of the console.`;
  static readonly BusinessSettingResetDialogTitle = $localize`Reset to default?`;
  static readonly BusinessSettingResetConfirmButton = $localize`:business setting:Reset`;
  static readonly BusinessSettingResetSuccess = $localize`Setting reset to default`;
  static readonly BusinessSettingMinutesUnit = $localize`:minutes unit short:min`;

  static businessSettingResetDialogMessage(description: string, value: string): string {
    return $localize`“${description}:description:” will return to its default value: ${value}:value:.`;
  }

  static readonly SettingPatternPartDay = $localize`:date pattern part:day`;
  static readonly SettingPatternPartMonth = $localize`:date pattern part:month`;
  static readonly SettingPatternPartYear = $localize`:date pattern part:year`;
  static readonly SettingPatternPartHour = $localize`:date pattern part:hour`;
  static readonly SettingPatternPartMinute = $localize`:date pattern part:minute`;
  static readonly SettingPatternPartTimeOfDay = $localize`:date pattern part:time of day`;

  static settingRuleRange(min: string, max: string): string {
    return $localize`From ${min}:min: to ${max}:max:`;
  }
  static settingRuleRangeMin(min: string): string {
    return $localize`At least ${min}:min:`;
  }
  static settingRuleRangeMax(max: string): string {
    return $localize`At most ${max}:max:`;
  }
  static settingRuleScale(maxScale: string): string {
    return $localize`At most ${maxScale}:maxScale: decimal places`;
  }
  static settingRuleLength(min: string, max: string): string {
    return $localize`From ${min}:min: to ${max}:max: characters`;
  }
  static settingRuleLengthMin(min: string): string {
    return $localize`At least ${min}:min: characters`;
  }
  static settingRuleLengthMax(max: string): string {
    return $localize`Up to ${max}:max: characters`;
  }
  static readonly SettingRuleSingleLine = $localize`A single line, without line breaks`;
  static readonly SettingRuleTrimmed = $localize`No spaces at the start or end`;
  static settingRuleRequiredParts(parts: string): string {
    return $localize`Must contain: ${parts}:parts:`;
  }
  static settingRuleForbiddenParts(parts: string): string {
    return $localize`Must not contain: ${parts}:parts:`;
  }
  static settingRuleUnknown(type: string): string {
    return $localize`Rule: ${type}:type:`;
  }

  static readonly SettingViolationType = $localize`Enter a number.`;
  static readonly SettingViolationWholeMinutes = $localize`Enter a whole number of minutes.`;
  static settingViolationScale(maxScale: string): string {
    return $localize`Use at most ${maxScale}:maxScale: decimal places.`;
  }
  static settingViolationRange(rule: string): string {
    return $localize`Out of range: ${rule}:rule:.`;
  }
  static settingViolationLength(rule: string): string {
    return $localize`Wrong length: ${rule}:rule:.`;
  }
  static readonly SettingViolationSingleLine = $localize`The text must be on a single line.`;
  static readonly SettingViolationTrimmed = $localize`Remove the spaces at the start or end.`;
  static readonly SettingViolationCountryCode = $localize`Enter a valid two-letter country code, for example LT.`;
  static readonly SettingViolationKnownCity = $localize`This city is not known. Check the spelling or choose another city.`;
  static readonly SettingViolationTimeZone = $localize`Enter a valid time zone region, for example Europe/Vilnius.`;
  static readonly SettingViolationGeoLocationRef = $localize`Choose the location again and save it.`;
  static readonly SettingViolationCurrencyCode = $localize`Enter a valid three-letter currency code, for example EUR.`;
  static readonly SettingViolationPatternMalformed = $localize`This is not a valid date and time pattern.`;
  static readonly SettingViolationPatternUnformattable = $localize`This pattern cannot be used to print a date and time.`;
  static settingViolationPatternMissing(parts: string): string {
    return $localize`The pattern is missing: ${parts}:parts:.`;
  }
  static readonly SettingViolationPatternTimeOfDay = $localize`A date pattern must not contain a time of day.`;
  static readonly SettingViolationBlank = $localize`The value must not be empty.`;
  static settingViolationUnknown(code: string): string {
    return $localize`The value breaks the rule “${code}:code:”.`;
  }

  static readonly SettingHistoryColumnChangedAt = $localize`Changed at`;
  static readonly SettingHistoryColumnChange = $localize`:setting history column:Change`;
  static readonly SettingHistoryColumnAuthor = $localize`Changed by`;
  static readonly SettingHistoryKindSet = $localize`:setting change kind:New value`;
  static readonly SettingHistoryKindReset = $localize`:setting change kind:Reset to default`;
  static readonly SettingHistoryFilterAll = $localize`All settings`;
  static readonly SettingHistoryEmptyState = $localize`No changes found for the selected filters.`;
  static readonly SettingHistoryLoadError = $localize`The change history could not be loaded.`;

  static readonly SettingQuoteTtlLabel = $localize`:business setting name:Price quote validity`;
  static readonly SettingQuoteTtlHint = $localize`How long an issued rental price quote stays valid before it has to be calculated again.`;
  static readonly SettingDebtWriteOffToleranceLabel = $localize`:business setting name:Debt write-off tolerance`;
  static readonly SettingDebtWriteOffToleranceHint = $localize`A customer debt shortfall below this amount may be written off.`;
  static readonly SettingTimeIncrementLabel = $localize`:business setting name:Rental time rounding step`;
  static readonly SettingTimeIncrementHint = $localize`Rental time is rounded up to a multiple of this step before the cost is calculated.`;
  static readonly SettingOvertimeForgivenessLabel = $localize`:business setting name:Forgiven overtime`;
  static readonly SettingOvertimeForgivenessHint = $localize`Overtime up to this length past the planned return is not charged. 0 means overtime is never forgiven.`;
  static readonly SettingEarlyReturnWindowLabel = $localize`:business setting name:Free early return window`;
  static readonly SettingEarlyReturnWindowHint = $localize`Equipment returned within this time after the rental started is free of charge. 0 means there is no free window.`;
  static readonly SettingAgreementDateTimePatternLabel = $localize`:business setting name:Agreement date and time format`;
  static readonly SettingAgreementDateTimePatternHint = $localize`How dates with a time are written on the rental agreement document.`;
  static readonly SettingAgreementDatePatternLabel = $localize`:business setting name:Agreement title date format`;
  static readonly SettingAgreementDatePatternHint = $localize`How the date is written in the title of the rental agreement document.`;
  static readonly SettingSignaturePlaceholderLabel = $localize`:business setting name:Signature box text`;
  static readonly SettingCountryLabel = $localize`:business setting name:Country`;
  static readonly SettingCountryHint = $localize`The two-letter ISO code of the country the business operates in, for example LT.`;
  static readonly SettingCityLabel = $localize`:business setting name:City`;
  static readonly SettingCityHint = $localize`The city the business operates in. When declared, it sets the business time zone unless a time zone is set explicitly.`;
  static readonly SettingTimeZoneLabel = $localize`:business setting name:Time zone`;
  static readonly SettingTimeZoneHint = $localize`The time zone region, for example Europe/Vilnius. Rental times, reports and agreements use the time zone of the pick-up point.`;
  static readonly SettingPointValuesTitle = $localize`Rental points`;
  static readonly SettingPointColumnPoint = $localize`:setting point column:Rental point`;
  static readonly SettingPointColumnValue = $localize`:setting point column:Value`;
  static readonly SettingPointColumnOrigin = $localize`:setting point column:Origin`;
  static readonly SettingPointOwnValue = $localize`Own value`;
  static readonly SettingPointInheritedValue = $localize`Inherited from business`;
  static readonly SettingPointValuesEmpty = $localize`No rental points yet.`;
  static readonly SettingPointResetDialogTitle = $localize`Remove the point's own value?`;
  static readonly SettingPointResetSuccess = $localize`The rental point now inherits the business value`;
  static readonly SettingPointZoneConfirmTitle = $localize`Use a different time zone?`;
  static readonly SettingPointZoneConfirmButton = $localize`Use this time zone`;
  static readonly SettingHistoryBusinessLevel = $localize`:setting history level:Whole business`;
  static settingPointDialogTitle(point: string): string {
    return $localize`Change setting for ${point}:point:`;
  }
  static settingPointResetDialogMessage(point: string, value: string): string {
    return $localize`“${point}:point:” will inherit the business value: ${value}:value:.`;
  }
  static settingPointZoneConfirmMessage(
    point: string,
    pointZone: string,
    businessZone: string,
  ): string {
    return $localize`“${point}:point:” will use ${pointZone}:pointZone:, while the business uses ${businessZone}:businessZone:. Rental times, reports and agreements of this point will follow its own time zone.`;
  }
  static settingHistoryPointLevel(point: string): string {
    return $localize`:setting history level:Rental point: ${point}:point:`;
  }
  static readonly SettingCurrencyLabel = $localize`:business setting name:Currency`;
  static readonly SettingGeoLocationLabel = $localize`:business setting name:Business location`;
  static readonly SettingGeoLocationHint = $localize`The country, city and street of the business. It will replace the Country and City settings in a later release.`;
  static readonly SettingCurrencyHint = $localize`The three-letter ISO code of the business currency, for example EUR or USD. Changing it clears the custom symbol.`;
  static readonly SettingCurrencySymbolLabel = $localize`:business setting name:Currency symbol`;
  static readonly SettingCurrencySymbolHint = $localize`Shown next to amounts on screen. Documents keep the currency code. Without a value, the default symbol of the currency is used.`;
  static readonly SettingSignaturePlaceholderHint = $localize`The text printed in the empty signature box of the rental agreement document.`;

  static readonly DatePatternLegendTitle = $localize`Pattern symbols`;
  static readonly DatePatternLegendIntro = $localize`Letters in the pattern are replaced by parts of the date; dots, dashes, slashes, spaces and commas are printed as is.`;
  static readonly DatePatternLegendExampleDate = $localize`Examples are for Thursday, 5 March 2026, 09:07:00.`;
  static readonly DatePatternSymbolYear4 = $localize`Year, four digits (2026)`;
  static readonly DatePatternSymbolYear2 = $localize`Year, last two digits (26)`;
  static readonly DatePatternSymbolMonth2 = $localize`Month, two digits (03)`;
  static readonly DatePatternSymbolMonth1 = $localize`Month, without a leading zero (3)`;
  static readonly DatePatternSymbolMonthShort = $localize`Month, short name (Mar)`;
  static readonly DatePatternSymbolMonthFull = $localize`Month, full name (March)`;
  static readonly DatePatternSymbolDay2 = $localize`Day of the month, two digits (05)`;
  static readonly DatePatternSymbolDay1 = $localize`Day of the month, without a leading zero (5)`;
  static readonly DatePatternSymbolWeekdayShort = $localize`Day of the week, short name (Thu)`;
  static readonly DatePatternSymbolWeekdayFull = $localize`Day of the week, full name (Thursday)`;
  static readonly DatePatternSymbolHour24 = $localize`Hour 00–23, two digits (09)`;
  static readonly DatePatternSymbolHour24Short = $localize`Hour 0–23, without a leading zero (9)`;
  static readonly DatePatternSymbolHour12 = $localize`Hour 01–12, two digits, use with “a” (09)`;
  static readonly DatePatternSymbolAmPm = $localize`AM or PM`;
  static readonly DatePatternSymbolMinute = $localize`Minutes, two digits (07)`;
  static readonly DatePatternSymbolSecond = $localize`Seconds, two digits (00)`;
  static readonly DatePatternSymbolLiteral = $localize`Text in single quotes is printed as is`;
  static readonly DatePatternSymbolCaseNote = $localize`Letter case matters: MM is the month, mm is minutes.`;
}
