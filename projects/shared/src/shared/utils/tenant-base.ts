import { environment } from '../../environments/environment';
import { TENANT_SLUG_PATTERN } from './deployed-path';

export const LOCALE_COOKIE = 'bikerental_locale';

const LOCALE_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 365;

export function adoptTenantBase(app: string): boolean {
  const base = document.querySelector('base');
  const staticPath = new URL(document.baseURI).pathname;
  const marker = `/${app}/`;
  const at = staticPath.lastIndexOf(marker);

  if (!base || at < 0) {
    return true;
  }

  const prefix = staticPath.slice(0, at + 1);
  const appAndLocale = staticPath.slice(at + 1);
  const locale = appAndLocale.slice(marker.length - 1).replace(/\/+$/, '');
  const { pathname, search, hash } = window.location;
  const [slug, appSegment, ...route] = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length).split('/')
    : [];

  if (!slug || !TENANT_SLUG_PATTERN.test(slug) || appSegment !== app) {
    window.location.replace(environment.gatewayAddress || prefix);
    return false;
  }

  const tenantBase = `${prefix}${slug}/${appAndLocale}`;
  const routePath = locale && route[0] === locale ? route.slice(1) : route;
  const target = `${tenantBase}${routePath.join('/')}`;

  if (target !== pathname) {
    history.replaceState(history.state, '', target + search + hash);
  }
  if (locale) {
    rememberLocale(locale);
  }
  base.setAttribute('href', tenantBase);
  return true;
}

function rememberLocale(locale: string): void {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_S}; SameSite=Lax`;
  } catch {
    return;
  }
}
