export class FormErrorMessages {
  static readonly slugRequired = $localize`Slug is required`;
  static readonly slugPattern = $localize`Only letters, numbers, hyphens and underscores`;
  static readonly slugMaxLength = $localize`Maximum 50 characters`;
  static readonly nameRequired = $localize`Name is required`;
  // Common equipment-related messages
  static readonly serialNumberRequired = $localize`Serial number is required`;
  static readonly serialNumberMaxLength = $localize`Maximum 50 characters`;
}
