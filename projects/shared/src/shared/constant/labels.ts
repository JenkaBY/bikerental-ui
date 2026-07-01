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
  static readonly EditStatus = $localize`Edit Status`;
  static readonly CreateStatus = $localize`Create Status`;
  static readonly AllowedTransitions = $localize`Allowed Transitions`;

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
  static readonly TransitionFrom = $localize`Transition from`;
  static readonly TransitionTo = $localize`to`;
  static readonly NoTransitionsAvailable = $localize`No transitions for this status`;
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
  static readonly AllStatuses = $localize`All Statuses`;

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
  static readonly CustomerNewRentalButton = $localize`New rental`;
  static readonly CustomerNewRentalComingSoon = $localize`New rental feature coming soon`;
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
  static readonly TodaysHistory = $localize`Today's History`;
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
  static readonly TopUpError = $localize`Top up failed. Please try again.`;

  static readonly WithdrawDialogTitle = $localize`Withdraw`;
  static readonly WithdrawAmountLabel = $localize`Amount`;
  static readonly WithdrawPaymentMethodLabel = $localize`Payout method`;
  static readonly WithdrawAvailableHint = $localize`Available`;
  static readonly WithdrawConfirmButton = $localize`Confirm`;
  static readonly WithdrawError = $localize`Withdrawal failed. Please try again.`;

  static readonly PaymentMethodCash = $localize`Cash`;
  static readonly PaymentMethodBankTransfer = $localize`Bank transfer`;
  static readonly PaymentMethodCardTerminal = $localize`Card terminal`;

  static readonly CustomerTransactionsTabLabel = $localize`Transactions`;
  static readonly CustomerTransactionsEmptyState = $localize`No transactions found`;
  static readonly CustomerTransactionsLoadError = $localize`Failed to load transactions`;
  static readonly TransactionAmountLabel = $localize`Amount`;
  static readonly TransactionDateLabel = $localize`Date`;
  static readonly TransactionDescriptionLabel = $localize`Description`;
  static readonly TransactionTypeLabel = $localize`Type`;

  static readonly Duration = $localize`Duration`;
  static readonly DurationMinutes = $localize`Duration (min)`;
  static readonly MinuteShort = $localize`min`;
  static readonly HourShort = $localize`h`;
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
  static readonly ScanEquipmentToReturnTitle = $localize`Scan equipment to return`;
  static readonly NoActiveRentalForEquipment = $localize`No active or draft rental holds this equipment`;
  static readonly OpenActiveRentals = $localize`Open active rentals`;
  static readonly DiscountPercent = $localize`Discount (%)`;
  static readonly SpecialPrice = $localize`Special Price`;
  static readonly SpecialPriceModeLabel = $localize`Special price mode`;
  static readonly TotalCost = $localize`Total Cost`;
  static readonly ProjectedBalance = $localize`Balance after payment`;
  static readonly InsufficientBalance = $localize`Insufficient balance`;
  static readonly SaveDraft = $localize`Save Draft`;
  static readonly Next = $localize`Next`;
  static readonly DraftSaved = $localize`Draft saved`;
  static readonly NoEquipmentSelected = $localize`Add at least one item to proceed`;
  static readonly NoAvailableEquipment = $localize`No available equipment`;

  static readonly StartRental = $localize`Start Rental`;
  static readonly RentalStarted = $localize`Rental started`;
  static readonly RentalStartError = $localize`Failed to start rental. Please try again.`;
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
  static readonly ReturnedAt = $localize`returned at`;
  static readonly ShowDetails = $localize`Show details`;
  static readonly CollapseDetails = $localize`Collapse`;
  static readonly Subtotal = $localize`Subtotal`;
  static readonly DiscountLabel = $localize`Discount`;
  static readonly Total = $localize`Total`;
  static readonly SpecialPriceApplied = $localize`Special price applied`;
  static readonly ReturnPricing = $localize`Return pricing`;
  static readonly ReturnEquipmentButton = $localize`Return equipment`;
  static readonly BrokenEquipment = $localize`Broken`;
  static readonly CancelRental = $localize`Cancel rental`;
  static readonly KeepRental = $localize`Keep rental`;
  static readonly YesCancel = $localize`Yes, cancel`;
  static readonly CancelRentalConfirmation = $localize`Are you sure you want to cancel this rental?`;
  static readonly RentalReturnSuccess = $localize`Equipment returned successfully`;
  static readonly RentalCancelSuccess = $localize`Rental cancelled`;
  static readonly RentalReturnError = $localize`Failed to return equipment. Please try again.`;
  static readonly RentalCancelError = $localize`Failed to cancel rental. Please try again.`;

  static readonly ReturnDialogTitle = $localize`Confirm equipment return`;
  static readonly ItemsToReturn = $localize`Items to return`;
  static readonly EstimatedCost = $localize`Estimated cost`;
  static readonly TotalEstimated = $localize`Total estimated`;
  static readonly TotalCurrent = $localize`Total current`;
  static readonly AmountToRefund = $localize`To refund to customer`;
  static readonly AmountToCollect = $localize`To collect from customer`;
  static readonly NoSettlementNeeded = $localize`No settlement needed`;
  static readonly ConfirmReturnButton = $localize`Confirm return`;

  static readonly BrokenEquipmentTitle = $localize`Broken equipment`;
  static readonly BrokenEquipmentSubtitle = $localize`Select items to mark as broken and enter the penalty amount if applicable`;
  static readonly BrokenEquipmentPenaltyUnderDevelopment = $localize`Penalty submission is under development. Broken item tracking will be available in a future update.`;
  static readonly ItemsAlreadyReturned = $localize`items already returned`;
  static readonly Apply = $localize`Apply`;
  static readonly CurrencySymbol = $localize`BYN`;

  static readonly TimeTravelDialogTitle = $localize`Server Time`;
  static readonly TimeTravelReset = $localize`Reset`;

  static readonly PwaUpdateAvailable = $localize`A new version is available.`;
  static readonly PwaUpdateReload = $localize`Reload`;

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
}
