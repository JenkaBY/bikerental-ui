export class FormErrorMessages {
  static readonly required = $localize`This field is required`;
  static readonly slugRequired = $localize`Slug is required`;
  static readonly slugPattern = $localize`Only letters, numbers, hyphens and underscores`;
  static readonly slugMaxLength = $localize`Maximum 50 characters`;
  static readonly nameRequired = $localize`Name is required`;
  // Common equipment-related messages
  static readonly serialNumberRequired = $localize`Serial number is required`;
  static readonly serialNumberMaxLength = $localize`Maximum 50 characters`;
  static readonly nameMaxLength = $localize`Maximum 200 characters`;
  static readonly pricingTypeRequired = $localize`Pricing type is required`;
  static readonly validFromRequired = $localize`Valid from date is required`;
  static readonly mustBePositive = $localize`Value must be greater than zero`;
  static readonly mustBeNonNegative = $localize`Value must be zero or greater`;
  static readonly mustBeAtLeastOne = $localize`Value must be at least 1`;
  static readonly minimumExceedsFirstHour = $localize`Cannot exceed first hour price`;
}
