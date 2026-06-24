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

  // Finance
  [ErrorCode.INSUFFICIENT_BALANCE]: insufficientBalanceMessage,
  [ErrorCode.OVER_BUDGET_SETTLEMENT]: $localize`The settlement amount exceeds the available balance.`,
  [ErrorCode.INSUFFICIENT_HOLD]: $localize`The reserved amount is insufficient for this operation.`,

  // Rental
  [ErrorCode.INSUFFICIENT_FUNDS]: insufficientFundsMessage,
  [ErrorCode.HOLD_REQUIRED]: $localize`A payment hold is required before this action can proceed.`,
  [ErrorCode.EQUIPMENT_NOT_AVAILABLE]: rentalEquipmentNotAvailableMessage,

  // Identity (authentication & accounts)
  [ErrorCode.AUTH_REQUIRED]: $localize`Your session has expired. Please sign in again.`,
  [ErrorCode.ACCESS_DENIED]: $localize`You do not have permission to perform this action.`,
  [ErrorCode.USERNAME_DUPLICATE]: $localize`This username is already taken.`,
  [ErrorCode.EMAIL_DUPLICATE]: $localize`This email address is already in use.`,
  [ErrorCode.PASSWORD_POLICY_VIOLATION]: $localize`The password does not meet the required policy (8–20 characters, at least one letter and one digit).`,
  [ErrorCode.PASSWORD_INVALID_CURRENT]: $localize`The current password is incorrect.`,

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
