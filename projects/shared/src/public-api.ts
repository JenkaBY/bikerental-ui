// App-level tokens (APP_BRAND, BRAND)
export * from './app.tokens';

// Core — generated API client (providers, services, models, tokens, utils)
// Export under the `api` namespace to avoid top-level symbol collisions
export * as api from './core/api/generated';
export { provideDefaultClient } from './core/api/generated/providers';

// Core — health monitoring
export * from './core/health/health.model';
export * from './core/health/health.service';
export * from './core/health/health-poller.service';

// Core — HTTP interceptors
export * from './core/interceptors/error.interceptor';
export * from './core/interceptors/error.service';

// Core — layout mode
export * from './core/layout-mode.service';

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

// Shared UI — components
export * from './shared/components/app-brand/app-brand.component';
export * from './shared/components/app-toolbar/app-toolbar.component';
export * from './shared/components/bottom-nav/bottom-nav.component';
export * from './shared/components/bottom-nav-item/bottom-nav-item.component';
export * from './shared/components/button/button.component';
export * from './shared/components/cancel-button/cancel-button.component';
export * from './shared/components/dashboard-card/dashboard-card.component';
export * from './shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
export * from './shared/components/health-indicator/health-indicator.component';
export * from './shared/components/health-indicator/health-tooltip-line.component';
export * from './shared/components/health-indicator/health-tooltip-lines.builder';
export * from './shared/components/health-indicator/health-tooltip.component';
export * from './shared/components/layout-mode-toggle/layout-mode-toggle.component';
export * from './shared/components/logout-button/logout-button.component';
export * from './shared/components/save-button/save-button.component';
export * from './shared/components/shell/shell.component';
export * from './shared/components/sidebar/sidebar.component';
export * from './shared/components/sidebar-nav-item/nav-item.model';
export * from './shared/components/sidebar-nav-item/sidebar-nav-item.component';
export * from './shared/components/payment-method/payment-method.component';
export * from './shared/components/toggle-button/toggle-button.component';
export * from './shared/components/customer/customer-view/customer-view.component';
export * from './shared/components/customer/customer-edit/customer-edit.component';
export * from './shared/components/customer/customer-create-dialog/customer-create-dialog.component';
// Shared UI — constants
export * from './shared/constant/labels';

// Shared UI — pipes
export * from './shared/pipes/truncate.pipe';
export * from './shared/pipes/money.pipe';

// Shared UI — utilities
export * from './shared/utils/date.util';

// Shared UI — validators
export * from './shared/validators/form-error-messages';
export * from './shared/validators/slug-validators';
export * from './shared/validators/phone-validators';
export * from './shared/validators/date-validators';

export * from './environments/environment';
