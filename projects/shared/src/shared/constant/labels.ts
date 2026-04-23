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
  static readonly CreateEquipment = $localize`Create Equipment`;
  static readonly EditEquipment = $localize`Edit Equipment`;
  static readonly FormatDate = $localize`Format Date:`;
  static readonly TransitionFrom = $localize`Transition from`;
  static readonly TransitionTo = $localize`to`;
  static readonly NoTransitionsAvailable = $localize`No transitions for this status`;
  // Added for equipment list
  static readonly Equipment = $localize`Equipment`;
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
  static readonly SearchByPhone = $localize`Search by phone (min. 4 digits)`;
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
}
