// App-level tokens (APP_BRAND, BRAND)
export * from './app.tokens';

// Core — generated API client (providers, services, models, tokens, utils)
// Export under the `api` namespace to avoid top-level symbol collisions
export * as api from './core/api/generated';
export { provideDefaultClient } from './core/api/generated/providers';

// SSE
export * from './core/api/event-source';

// Core — health monitoring
export * from './core/health/health.model';
export * from './core/health/health.service';
export * from './core/health/health-poller.service';

// Core — error handling toolkit (typed ApiError, parser, resolver, notifications)
export * from './core/errors';

// Core — OIDC authentication (provider helper, service, interceptor, guards, screens)
export * from './core/auth';

// Core — HTTP interceptors
export * from './core/interceptors/accept-language.interceptor';
export * from './core/interceptors/error.interceptor';
export * from './core/interceptors/error.service';

// Core — layout mode
export * from './core/layout-mode.service';

export * from './core/locale-redirect.service';

// Core — mappers
export * from './core/mappers';

// Core — domain models
export * from './core/models';

// Core — signal state stores
export * from './core/state/equipment-status.store';
export * from './core/state/equipment-type.store';
export * from './core/state/equipment.store';
export * from './core/state/pricing-type.store';
export * from './core/state/tariff.store';
export * from './core/state/lookup-initializer.facade';
export * from './core/state/customer.store';
export * from './core/state/customer-finance.store';
export * from './core/state/customer-rating.service';
export * from './core/state/customer-list.store';
export * from './core/state/equipment-search.store';
export * from './core/state/equipment-scan-resolver.service';
export * from './core/state/rental.store';
export * from './core/state/rental-store.token';
export * from './core/state/batch-rental-property.store';
export * from './core/state/rental-list.store';
export * from './core/state/rental-search.store';
export * from './core/state/rental-lookup.store';
export * from './core/state/rental-cost-calculation.store';
export * from './core/state/return-equipment-cost.store';
export * from './core/state/rental-transactions.store';
export * from './core/state/rental-validation.store';
export * from './core/state/user.store';
export * from './core/state/managed-user.store';
export * from './core/state/profile.store';
export * from './core/state/time-travel.store';
export * from './core/state/time-travel-store.token';
export * from './core/state/time.store';
export * from './core/state/agreement-template.store';
export * from './core/state/agreement-signing.store';
export * from './core/state/rental-signature.store';

// Shared UI — components
export * from './shared/components/app-brand/app-brand.component';
export * from './shared/components/app-toolbar/app-toolbar.component';
export * from './shared/components/time-travel-display/time-travel-display.component';
export * from './shared/components/time-travel-dialog/time-travel-dialog.component';
export * from './shared/components/bottom-nav/bottom-nav.component';
export * from './shared/components/bottom-nav-item/bottom-nav-item.component';
export * from './shared/components/button/button.component';
export * from './shared/components/cancel-button/cancel-button.component';
export * from './shared/components/dashboard-card/dashboard-card.component';
export * from './shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
export * from './shared/components/top-up-button/top-up-button.component';
export * from './shared/components/withdraw-button/withdraw-button.component';
export * from './shared/components/health-indicator/health-indicator.component';
export * from './shared/components/health-indicator/health-tooltip-line.component';
export * from './shared/components/health-indicator/health-tooltip-lines.builder';
export * from './shared/components/health-indicator/health-tooltip.component';
export * from './shared/components/layout-mode-toggle/layout-mode-toggle.component';
export * from './shared/components/logout-button/logout-button.component';
export * from './shared/components/page-header/page-header.component';
export * from './shared/components/segmented-tabs/segmented-tabs.component';
export * from './shared/components/user-avatar/user-avatar.component';
export * from './shared/components/profile-menu/profile-menu.component';
export * from './shared/components/profile-settings/profile-settings.component';
export * from './shared/components/profile-settings/profile-settings.routes';
export * from './shared/components/save-button/save-button.component';
export * from './shared/components/top-up-dialog/top-up-dialog.component';
export * from './shared/components/withdraw-dialog/withdraw-dialog.component';
export * from './shared/components/withdraw-dialog/max-amount.validator';
export * from './shared/components/temporary-password-dialog/temporary-password-dialog.component';
export * from './shared/components/confirm-dialog/confirm-dialog.component';
export * from './shared/components/shell/shell.component';
export * from './shared/components/sidebar/sidebar.component';
export * from './shared/components/sidebar-nav-item/nav-item.model';
export * from './shared/components/sidebar-nav-item/sidebar-nav-item.component';
export * from './shared/components/payment-method/payment-method.component';
export * from './shared/components/toggle-button/toggle-button.component';
export * from './shared/components/customer/customer-view/customer-view.component';
export * from './shared/components/customer/customer-edit/customer-edit.component';
export * from './shared/components/customer/customer-create-dialog/customer-create-dialog.component';
export * from './shared/components/customer/customer-form.provider';
export * from './shared/components/customer/customer-rating-badge/customer-rating-badge.component';
export * from './shared/components/customer/customer-balance-pill/customer-balance-pill.component';
export * from './shared/components/customer/customer-comments-list/customer-comments-list.component';
export * from './shared/components/customer/customer-panel-header/customer-panel-header.component';
export * from './shared/components/customer/profile-page/customer-profile.routes';
export * from './shared/components/customer/profile-page/tabs/customer-rentals/customer-rental-list-item.component';
export * from './shared/components/qr-scanner/barcode-scanner.service';
export * from './shared/components/qr-scanner/qr-payload-parser';
export * from './shared/components/qr-scanner/qr-scanner.component';
export * from './shared/components/qr-scanner/qr-scan-dialog.component';
export * from './shared/components/signature-pad/signature-pad.component';
export * from './shared/components/transaction/transaction-list-item.component';
export * from './shared/components/equipment-badge/equipment-badge.component';
export * from './shared/components/equipment-status-badge/equipment-status-badge.component';
export * from './shared/components/cost-breakdown/cost-breakdown.component';
export * from './shared/components/equipment-unit/equipment-unit-summary.component';
export * from './shared/components/equipment-unit/equipment-unit-details.component';
export * from './shared/components/equipment-unit/equipment-unit-card.component';
// Shared UI — constants
export * from './shared/constant/labels';
export * from './shared/constant/breakdown-messages';
export * from './shared/constant/mobile-form-dialog.config';

// Shared UI — presentation/meta maps (rental + equipment-item status)
export * from './shared/rental-status.meta';
export * from './shared/transaction.meta';

// Shared UI — pipes
export * from './shared/pipes/truncate.pipe';
export * from './shared/pipes/money.pipe';
export * from './shared/pipes/duration.pipe';
export * from './shared/pipes/duration-formatter';
export * from './shared/pipes/price-prefix.pipe';
export * from './shared/directives/phone-characters-only.directive';
export * from './shared/directives/max-decimals.directive';

// Shared UI — utilities
export * from './shared/utils/date.util';
export * from './shared/utils/deployed-path';
export * from './shared/utils/user-initials.util';

// Shared UI — validators
export * from './shared/validators/form-error-messages';
export * from './shared/validators/slug-validators';
export * from './shared/validators/phone-validators';
export * from './shared/validators/date-validators';
export * from './shared/validators/number-validators';

export * from './environments/environment';
