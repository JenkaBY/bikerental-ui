export const ErrorCode = {
  // shared.* — validation (400)
  VALIDATION_ERROR: 'shared.request.validation_failed',
  METHOD_ARGUMENTS_VALIDATION_FAILED: 'shared.method_arguments.validation_failed',
  HANDLER_METHOD_ERROR: 'shared.request.method_parameters_invalid',
  CONSTRAINT_VIOLATION: 'shared.request.constraint_violation',
  METHOD_ARGUMENT_TYPE_MISMATCH: 'shared.request.type_mismatch',
  REQUEST_PARAMS_MISSING: 'shared.request.param_missing',
  NOT_READABLE: 'shared.request.not_readable',

  // shared.* — request protocol (4xx, not user-data errors)
  REQUEST_METHOD_NOT_ALLOWED: 'shared.request.method_not_allowed',
  REQUEST_MEDIA_TYPE_NOT_SUPPORTED: 'shared.request.media_type_not_supported',
  API_VERSION_MISSING: 'shared.api.version_missing',
  API_VERSION_INVALID: 'shared.api.version_invalid',

  // shared.* — resource lifecycle (4xx/5xx)
  INTERNAL_SERVER_ERROR: 'shared.server.internal_error',
  RESOURCE_NOT_FOUND: 'shared.resource.not_found',
  REFERENCE_NOT_FOUND: 'shared.reference.not_found',
  RESOURCE_CONFLICT: 'shared.resource.conflict',
  RESOURCE_OPTIMISTIC_LOCK: 'shared.resource.optimistic_lock',
  SHARED_EQUIPMENT_NOT_AVAILABLE: 'shared.equipment.not_available',

  // finance.*
  INSUFFICIENT_BALANCE: 'finance.insufficient_balance',
  OVER_BUDGET_SETTLEMENT: 'finance.over_budget_settlement',
  INSUFFICIENT_HOLD: 'finance.insufficient_hold',

  // rental.*
  INSUFFICIENT_FUNDS: 'rental.insufficient_funds',
  HOLD_REQUIRED: 'rental.hold.required',
  EQUIPMENT_NOT_AVAILABLE: 'rental.equipment.not_available',
  STATUS_INVALID: 'rental.status.invalid',
  WINDOW_ELAPSED: 'rental.window.elapsed',

  // identity.* — authentication & accounts
  AUTH_REQUIRED: 'identity.authentication.required',
  ACCESS_DENIED: 'identity.access.denied',
  USERNAME_DUPLICATE: 'identity.username.duplicate',
  EMAIL_DUPLICATE: 'identity.email.duplicate',
  PASSWORD_POLICY_VIOLATION: 'identity.password.policy_violation',
  PASSWORD_INVALID_CURRENT: 'identity.password.invalid_current',

  // agreement.* — template lifecycle
  AGREEMENT_TEMPLATE_NOT_EDITABLE: 'agreement.template.not_editable',
  AGREEMENT_TEMPLATE_NOT_ACTIVATABLE: 'agreement.template.not_activatable',
  AGREEMENT_TEMPLATE_NOT_DELETABLE: 'agreement.template.not_deletable',
  AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION: 'agreement.template.concurrent_activation',
  AGREEMENT_PDF_RENDERING_FAILED: 'agreement.pdf.rendering_failed',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

const VALIDATION_CODES = new Set<string>([
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.METHOD_ARGUMENTS_VALIDATION_FAILED,
  ErrorCode.HANDLER_METHOD_ERROR,
  ErrorCode.CONSTRAINT_VIOLATION,
  ErrorCode.METHOD_ARGUMENT_TYPE_MISMATCH,
  ErrorCode.REQUEST_PARAMS_MISSING,
  ErrorCode.NOT_READABLE,
]);

const DOMAIN_CODES = new Set<string>([
  ErrorCode.RESOURCE_NOT_FOUND,
  ErrorCode.REFERENCE_NOT_FOUND,
  ErrorCode.RESOURCE_CONFLICT,
  ErrorCode.RESOURCE_OPTIMISTIC_LOCK,
  ErrorCode.SHARED_EQUIPMENT_NOT_AVAILABLE,
  ErrorCode.INSUFFICIENT_BALANCE,
  ErrorCode.OVER_BUDGET_SETTLEMENT,
  ErrorCode.INSUFFICIENT_HOLD,
  ErrorCode.INSUFFICIENT_FUNDS,
  ErrorCode.HOLD_REQUIRED,
  ErrorCode.EQUIPMENT_NOT_AVAILABLE,
  ErrorCode.STATUS_INVALID,
  ErrorCode.WINDOW_ELAPSED,
  ErrorCode.USERNAME_DUPLICATE,
  ErrorCode.EMAIL_DUPLICATE,
  ErrorCode.PASSWORD_POLICY_VIOLATION,
  ErrorCode.PASSWORD_INVALID_CURRENT,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_EDITABLE,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVATABLE,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_DELETABLE,
  ErrorCode.AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION,
  ErrorCode.AGREEMENT_PDF_RENDERING_FAILED,
]);

export function isValidationCode(code: string): boolean {
  return VALIDATION_CODES.has(code);
}

export function isDomainCode(code: string): boolean {
  return DOMAIN_CODES.has(code);
}
