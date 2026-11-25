// Applications served under a path segment of their own: /admin/en/…, /operator/ru/…
export const CONTAINER_APPS = ['admin', 'operator', 'platform'];

// The application served at the SITE ROOT. Its locales are top-level URLs — /en/…, /ru/… — because
// it is built with a base href of '/', so it has no segment of its own to live under. It is the
// index page: the thing a person reaches by typing the domain and nothing else.
//
// It is listed separately rather than added to CONTAINER_APPS because that difference is structural,
// not cosmetic: every routing rule generated for the two lists differs in shape.
export const ROOT_APP = 'gateway';

export const DEFAULT_LOCALE_SEGMENT = 'en';

// Applications that belong to one business and are addressed under its slug: /velo-riga/admin/en/…
// The slug comes first because the authorization server reads the business from it. Must stay in step
// with TENANT_APPS in projects/shared/src/shared/utils/deployed-path.ts.
export const TENANT_APPS = ['admin', 'operator'];

// The cookie each business application sets on boot so that an address without a locale segment —
// the sign-in callback, the post-logout landing — reopens in the language the person last used. Must
// stay in step with LOCALE_COOKIE in projects/shared/src/shared/utils/tenant-base.ts.
export const LOCALE_COOKIE = 'bikerental_locale';

// Same alphabet and length the authorization server accepts in the return address.
export const TENANT_SLUG_PATTERN = '[a-z0-9_-]{1,50}';
