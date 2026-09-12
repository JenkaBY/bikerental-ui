// Applications served under a path segment of their own: /admin/en/…, /operator/ru/…
export const CONTAINER_APPS = ['admin', 'operator'];

// The application served at the SITE ROOT. Its locales are top-level URLs — /en/…, /ru/… — because
// it is built with a base href of '/', so it has no segment of its own to live under. It is the
// index page: the thing a person reaches by typing the domain and nothing else.
//
// It is listed separately rather than added to CONTAINER_APPS because that difference is structural,
// not cosmetic: every routing rule generated for the two lists differs in shape.
export const ROOT_APP = 'gateway';

export const DEFAULT_LOCALE_SEGMENT = 'en';
