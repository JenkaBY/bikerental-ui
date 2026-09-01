import { ErrorCode } from './error-code';

export type MessageTemplate = string | ((params: Record<string, unknown>) => string);

// ─────────────────────────────────────────────────────────────────────────────
// Generic and status-level fallback messages (when no code-specific entry exists)
// ─────────────────────────────────────────────────────────────────────────────

export class ErrorMessages {
  static readonly generic = $localize`Something went wrong. Please try again.`;
  static readonly network = $localize`No connection to the server. Check your network and try again.`;

  // Per-status fallback messages (used when code is unknown but status is known)
  static readonly status400 = $localize`The request could not be processed.`;
  static readonly status401 = $localize`You are not authorized. Please sign in again.`;
  static readonly status403 = $localize`You do not have permission to perform this action.`;
  static readonly status404 = $localize`The requested resource was not found.`;
  static readonly status409 = $localize`This action conflicts with the current state of the data.`;
  static readonly status422 = $localize`Some of the submitted data is invalid.`;
  static readonly status500 = $localize`A server error occurred. Please try again later.`;

  static readonly statusFallbacks: Record<number, string> = {
    400: ErrorMessages.status400,
    401: ErrorMessages.status401,
    403: ErrorMessages.status403,
    404: ErrorMessages.status404,
    409: ErrorMessages.status409,
    422: ErrorMessages.status422,
    500: ErrorMessages.status500,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Code-specific messages (response-level and field-level validation)
// Used by resolveErrorMessage() and resolveFieldErrorMessage() for dynamic lookups
// ─────────────────────────────────────────────────────────────────────────────

export const ErrorMessageCatalog: Record<string, MessageTemplate> = {
  // ── Response-level codes (matched against ApiError.code) ──────────────────

  // Validation (backend sends errors[] — messages appear in summary toasts when
  // applyServerErrors() leaves unmatched field errors, or when there is no form to bind to)
  [ErrorCode.VALIDATION_ERROR]: $localize`Some of the submitted data is invalid. Please review the highlighted fields.`,
  [ErrorCode.METHOD_ARGUMENTS_VALIDATION_FAILED]: $localize`Some of the submitted data is invalid. Please review the highlighted fields.`,
  [ErrorCode.HANDLER_METHOD_ERROR]: $localize`One or more request parameters are invalid.`,
  [ErrorCode.CONSTRAINT_VIOLATION]: $localize`Some of the submitted data is invalid.`,
  [ErrorCode.METHOD_ARGUMENT_TYPE_MISMATCH]: $localize`A request parameter has an invalid value.`,
  [ErrorCode.REQUEST_PARAMS_MISSING]: $localize`A required request parameter is missing.`,
  [ErrorCode.NOT_READABLE]: $localize`The request body is missing or malformed.`,

  // Request protocol errors (typically a frontend bug, not a user error)
  [ErrorCode.REQUEST_METHOD_NOT_ALLOWED]: $localize`This action is not supported.`,
  [ErrorCode.REQUEST_MEDIA_TYPE_NOT_SUPPORTED]: $localize`Unsupported content type.`,
  [ErrorCode.API_VERSION_MISSING]: $localize`API version header is required.`,
  [ErrorCode.API_VERSION_INVALID]: $localize`The API version is no longer supported. Please refresh the page.`,

  // Resource lifecycle
  [ErrorCode.INTERNAL_SERVER_ERROR]: $localize`A server error occurred. Please try again later.`,
  [ErrorCode.RESOURCE_NOT_FOUND]: $localize`The requested item was not found.`,
  [ErrorCode.REFERENCE_NOT_FOUND]: $localize`A referenced item no longer exists. Please refresh and try again.`,
  [ErrorCode.RESOURCE_CONFLICT]: resourceConflictMessage,
  [ErrorCode.RESOURCE_OPTIMISTIC_LOCK]: $localize`This record was changed by someone else. Reload and try again.`,
  [ErrorCode.SHARED_EQUIPMENT_NOT_AVAILABLE]: sharedEquipmentNotAvailableMessage,
  [ErrorCode.SHARED_EQUIPMENT_NOT_FOUND]: sharedEquipmentNotFoundMessage,

  // Finance
  [ErrorCode.INSUFFICIENT_BALANCE]: insufficientBalanceMessage,
  [ErrorCode.OVER_BUDGET_SETTLEMENT]: $localize`The settlement amount exceeds the available balance.`,
  [ErrorCode.INSUFFICIENT_HOLD]: $localize`The reserved amount is insufficient for this operation.`,

  // Rental
  [ErrorCode.INSUFFICIENT_FUNDS]: insufficientFundsMessage,
  [ErrorCode.HOLD_REQUIRED]: $localize`A payment hold is required before this action can proceed.`,
  [ErrorCode.EQUIPMENT_NOT_AVAILABLE]: rentalEquipmentNotAvailableMessage,
  [ErrorCode.STATUS_INVALID]: rentalStatusInvalidMessage,
  [ErrorCode.WINDOW_ELAPSED]: $localize`This rental is overdue — return it before adding more equipment.`,
  [ErrorCode.ACTIVATION_NOT_READY]: $localize`The rental could not be prepared for signing — please review the details and try again.`,
  [ErrorCode.DEBT_WRITE_OFF_NOT_ALLOWED]: debtWriteOffNotAllowedMessage,

  // Return quote lifecycle (full-return quote → confirm flow)
  [ErrorCode.TARIFF_QUOTE_NOT_FOUND]: $localize`The price quote could not be found. Recalculating the current price…`,
  [ErrorCode.TARIFF_QUOTE_EXPIRED]: $localize`The price has expired and was recalculated. Review the new total and confirm again.`,
  [ErrorCode.TARIFF_QUOTE_ALREADY_CONSUMED]: $localize`This rental has already been completed.`,
  [ErrorCode.RENTAL_QUOTE_MISMATCH]: $localize`The rental changed since the price was calculated. Recalculating the current price…`,

  // Special pricing
  [ErrorCode.TARIFF_SPECIAL_TYPE_INVALID]: $localize`The configured special tariff is invalid. Contact an administrator.`,

  // Identity (authentication & accounts)
  [ErrorCode.AUTH_REQUIRED]: $localize`Your session has expired. Please sign in again.`,
  [ErrorCode.ACCESS_DENIED]: $localize`You do not have permission to perform this action.`,
  [ErrorCode.USERNAME_DUPLICATE]: $localize`This username is already taken.`,
  [ErrorCode.EMAIL_DUPLICATE]: $localize`This email address is already in use.`,
  [ErrorCode.PASSWORD_POLICY_VIOLATION]: $localize`The password does not meet the required policy (8–20 characters, at least one letter and one digit).`,
  [ErrorCode.PASSWORD_INVALID_CURRENT]: $localize`The current password is incorrect.`,

  // Agreement template lifecycle
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_EDITABLE]: agreementTemplateNotEditableMessage,
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVATABLE]: agreementTemplateNotActivatableMessage,
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_DELETABLE]: agreementTemplateNotDeletableMessage,
  [ErrorCode.AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION]: $localize`Another template was activated concurrently. The list has been refreshed — please retry.`,
  [ErrorCode.AGREEMENT_PDF_RENDERING_FAILED]: $localize`The PDF could not be generated. Please try again.`,

  // Agreement signing flow (FR-03)
  [ErrorCode.AGREEMENT_TEMPLATE_NO_ACTIVE]: $localize`There is no active agreement version. Ask an administrator to activate one.`,
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVE]: agreementTemplateNotActiveMessage,
  [ErrorCode.AGREEMENT_SIGNING_ALREADY_SIGNED]: $localize`This rental has already been signed and is now active.`,
  [ErrorCode.AGREEMENT_SIGNING_RENTAL_VERSION_MISMATCH]: $localize`The rental data changed since this screen was loaded. It has been reloaded — please review and try again.`,
  [ErrorCode.AGREEMENT_SIGNING_RENTAL_NOT_AWAITING_SIGNATURE]:
    agreementSigningRentalNotAwaitingSignatureMessage,
  [ErrorCode.AGREEMENT_SIGNING_INVALID_SIGNATURE_IMAGE]: $localize`The signature image is invalid. Please sign again.`,

  // Damage reports (maintenance)
  [ErrorCode.MAINTENANCE_EQUIPMENT_NOT_IN_RENTAL]: maintenanceEquipmentNotInRentalMessage,

  // ── Field-level validation codes (matched against FieldError.code) ────────
  // Derived from Bean Validation annotations as validation.<snake_case_annotation_name>
  // resolveFieldErrorMessage() uses these before falling back to field.message

  'validation.not_null': $localize`This field is required.`,
  'validation.not_blank': $localize`This field is required.`,
  'validation.not_empty': $localize`This field is required.`,
  'validation.size': validationSizeMessage,
  'validation.min': validationMinMessage,
  'validation.max': validationMaxMessage,
  'validation.decimal_min': validationDecimalMinMessage,
  'validation.decimal_max': validationDecimalMaxMessage,
  'validation.digits': validationDigitsMessage,
  'validation.positive': $localize`Must be greater than zero.`,
  'validation.positive_or_zero': $localize`Must be zero or greater.`,
  'validation.negative': $localize`Must be less than zero.`,
  'validation.negative_or_zero': $localize`Must be zero or less.`,
  'validation.email': $localize`Enter a valid email address.`,
  'validation.pattern': $localize`The value does not match the required format.`,
  'validation.past': $localize`Must be a date in the past.`,
  'validation.past_or_present': $localize`Must be today or earlier.`,
  'validation.future': $localize`Must be a date in the future.`,
  'validation.future_or_present': $localize`Must be today or later.`,
  'validation.assert_true': $localize`Must be accepted.`,
  'validation.assert_false': $localize`Must not be set.`,

  // User settings (field: 'settings') — only 'locale' is validated today
  'validation.supported_user_settings': $localize`This language is not supported.`,

  // Class-level rental pricing rules (field: null — render as a general form message)
  'validation.special_tariff_consistency': $localize`A fixed price requires a special tariff — both must be set together.`,
  'validation.special_tariff_and_discount_exclusive': $localize`A discount and a fixed price cannot be applied at the same time.`,

  // Cross-field date range rule (field: null; params.from/params.to name the invalid pair)
  'validation.valid_date_range': validDateRangeMessage,

  // Class-level range-size rule (field: null; params.maxDays names the limit)
  'validation.max_date_range': maxDateRangeMessage,

  // Class-level damage report rule (field: null) — should be unreachable since the UI always
  // supplies exactly one of rentalId/customerId, kept as a safety net
  [ErrorCode.RESPONSIBLE_PARTY_REQUIRED]: $localize`Select either a rental or a customer to attach this report to — not both, not neither.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions for parameterized messages (response-level codes)
// ─────────────────────────────────────────────────────────────────────────────

function resourceConflictMessage(params: Record<string, unknown>): string {
  const identifier = params['identifier'];
  if (typeof identifier === 'string' && identifier.length > 0) {
    return $localize`"${identifier}:identifier:" already exists.`;
  }
  return $localize`This record already exists.`;
}

function sharedEquipmentNotAvailableMessage(params: Record<string, unknown>): string {
  const ids = params['identifiers'];
  if (Array.isArray(ids) && ids.length > 0) {
    return $localize`Equipment ${ids.map(String).join(', ')}:ids: is out of service and cannot be rented.`;
  }
  return $localize`The selected equipment is out of service.`;
}

function sharedEquipmentNotFoundMessage(params: Record<string, unknown>): string {
  const ids = params['identifiers'];
  if (Array.isArray(ids) && ids.length > 0) {
    return $localize`Equipment ${ids.map(String).join(', ')}:ids: could not be found. Nothing was changed.`;
  }
  return $localize`One or more equipment items could not be found. Nothing was changed.`;
}

function maintenanceEquipmentNotInRentalMessage(params: Record<string, unknown>): string {
  const ids = params['identifiers'];
  const rentalId = params['rentalId'];
  if (Array.isArray(ids) && ids.length > 0 && rentalId != null) {
    return $localize`Equipment ${ids.map(String).join(', ')}:ids: is not part of rental #${String(rentalId)}:rentalId:. Nothing was changed.`;
  }
  return $localize`One or more items are not part of this rental. Nothing was changed.`;
}

function insufficientBalanceMessage(params: Record<string, unknown>): string {
  const available = params['available'];
  const requested = params['requested'];
  if (typeof available === 'number' && typeof requested === 'number') {
    return $localize`Insufficient balance. Available: ${available.toFixed(2)}:available:, requested: ${requested.toFixed(2)}:requested:.`;
  }
  return $localize`The account balance is insufficient for this operation.`;
}

function insufficientFundsMessage(params: Record<string, unknown>): string {
  const available = params['available'];
  const requested = params['requested'];
  if (typeof available === 'number' && typeof requested === 'number') {
    return $localize`The customer has insufficient funds. Available: ${available.toFixed(2)}:available:, required: ${requested.toFixed(2)}:required:.`;
  }
  return $localize`The customer has insufficient funds for this rental.`;
}

function rentalEquipmentNotAvailableMessage(params: Record<string, unknown>): string {
  const ids = params['unavailableIds'];
  if (Array.isArray(ids) && ids.length > 0) {
    return $localize`Equipment ${ids.map(String).join(', ')}:ids: is already rented out.`;
  }
  return $localize`The selected equipment is already rented out.`;
}

function rentalStatusInvalidMessage(params: Record<string, unknown>): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This rental is no longer active (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This rental is no longer active.`;
}

function debtWriteOffNotAllowedMessage(params: Record<string, unknown>): string {
  const shortfall = params['shortfall'];
  const tolerance = params['tolerance'];
  if (typeof shortfall === 'number' && typeof tolerance === 'number') {
    return $localize`The remaining shortfall of ${shortfall.toFixed(2)}:shortfall: exceeds the automatic write-off limit of ${tolerance.toFixed(2)}:tolerance:. Settle this rental manually first.`;
  }
  return $localize`The remaining shortfall is too large to write off automatically. Settle this rental manually first.`;
}

function agreementTemplateNotEditableMessage(params: Record<string, unknown>): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This template can no longer be edited (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This template can no longer be edited.`;
}

function agreementTemplateNotActivatableMessage(params: Record<string, unknown>): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This template cannot be activated (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This template cannot be activated.`;
}

function agreementTemplateNotDeletableMessage(params: Record<string, unknown>): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This template cannot be deleted (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This template cannot be deleted.`;
}

function agreementTemplateNotActiveMessage(params: Record<string, unknown>): string {
  const requestedTemplateId = params['requestedTemplateId'];
  const activeTemplateId = params['activeTemplateId'];
  if (requestedTemplateId != null && activeTemplateId != null) {
    return $localize`The agreement text changed since this screen was loaded (was version ${String(requestedTemplateId)}:requestedTemplateId:, now ${String(activeTemplateId)}:activeTemplateId:). Please review the updated text and try again.`;
  }
  return $localize`The agreement text changed since this screen was loaded. Please review the updated text and try again.`;
}

function agreementSigningRentalNotAwaitingSignatureMessage(
  params: Record<string, unknown>,
): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This rental is no longer awaiting signature (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This rental is no longer awaiting signature.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions for parameterized messages (field-level validation codes)
// ─────────────────────────────────────────────────────────────────────────────

function validationSizeMessage(params: Record<string, unknown>): string {
  const min = params['min'];
  const max = params['max'];
  const hasMin = typeof min === 'number' && min > 0;
  const hasMax = typeof max === 'number' && max < 2_147_483_647;
  if (hasMin && hasMax) {
    return $localize`Must be between ${min}:min: and ${max}:max: characters.`;
  }
  if (hasMin) {
    return $localize`Must be at least ${min}:min: characters.`;
  }
  if (hasMax) {
    return $localize`Must be at most ${max}:max: characters.`;
  }
  return $localize`The value is too short or too long.`;
}

function validationMinMessage(params: Record<string, unknown>): string {
  const value = params['value'];
  if (typeof value === 'number') {
    return $localize`Must be at least ${value}:value:.`;
  }
  return $localize`The value is too small.`;
}

function validationMaxMessage(params: Record<string, unknown>): string {
  const value = params['value'];
  if (typeof value === 'number') {
    return $localize`Must be no more than ${value}:value:.`;
  }
  return $localize`The value is too large.`;
}

function validationDecimalMinMessage(params: Record<string, unknown>): string {
  const value = params['value'];
  const inclusive = params['inclusive'];
  if (typeof value === 'string' || typeof value === 'number') {
    return inclusive === false
      ? $localize`Must be greater than ${value}:value:.`
      : $localize`Must be at least ${value}:value:.`;
  }
  return $localize`The value is too small.`;
}

function validationDecimalMaxMessage(params: Record<string, unknown>): string {
  const value = params['value'];
  const inclusive = params['inclusive'];
  if (typeof value === 'string' || typeof value === 'number') {
    return inclusive === false
      ? $localize`Must be less than ${value}:value:.`
      : $localize`Must be at most ${value}:value:.`;
  }
  return $localize`The value is too large.`;
}

const DATE_RANGE_PARAM_LABELS: Record<string, string> = {
  from: $localize`Created from`,
  to: $localize`Created to`,
  returnedFrom: $localize`Returned from`,
  returnedTo: $localize`Returned to`,
  activeFrom: $localize`Active from`,
  activeTo: $localize`Active to`,
};

function validDateRangeMessage(params: Record<string, unknown>): string {
  const from = params['from'];
  const to = params['to'];
  const fromLabel = typeof from === 'string' ? (DATE_RANGE_PARAM_LABELS[from] ?? from) : undefined;
  const toLabel = typeof to === 'string' ? (DATE_RANGE_PARAM_LABELS[to] ?? to) : undefined;
  if (fromLabel && toLabel) {
    return $localize`"${fromLabel}:from:" must be on or before "${toLabel}:to:".`;
  }
  return $localize`The start date must be on or before the end date.`;
}

function maxDateRangeMessage(params: Record<string, unknown>): string {
  const maxDays = params['maxDays'];
  if (typeof maxDays === 'number') {
    return $localize`The selected range must not exceed ${maxDays}:maxDays: days.`;
  }
  return $localize`The selected date range is too large.`;
}

function validationDigitsMessage(params: Record<string, unknown>): string {
  const integer = params['integer'];
  const fraction = params['fraction'];
  if (typeof integer === 'number' && typeof fraction === 'number') {
    return fraction === 0
      ? $localize`Must have at most ${integer}:integer: digits.`
      : $localize`Must have at most ${integer}:integer: digits and ${fraction}:fraction: decimal places.`;
  }
  return $localize`The value has too many digits.`;
}
