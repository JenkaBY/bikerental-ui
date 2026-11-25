import { environment } from '../../environments/environment';
import { DeployedPath } from '../../shared/utils/deployed-path';

const DEV_LOGIN_PARAMS: Readonly<Record<string, string>> = {
  user: 'username',
  tenant: 'tenantId',
  at: 'accessTokenTtl',
  rt: 'refreshTokenTtl',
  refresh: 'includeRefreshToken',
};

let devLogin: Promise<boolean> = Promise.resolve(false);

export function devLoginRedirect(): Promise<boolean> {
  return devLogin;
}

export function startDevLoginIfRequested(clientId: string, configId: string): void {
  if (environment.devAuth) {
    devLogin = requestDevSession(clientId, configId);
  }
}

async function requestDevSession(clientId: string, configId: string): Promise<boolean> {
  const current = new URL(window.location.href);
  const roles = current.searchParams.get('devLogin');

  if (!roles) {
    return false;
  }

  const session = new URL('/api/dev/auth/session', environment.apiUrl);
  session.searchParams.set('clientId', clientId);
  session.searchParams.set('roles', roles);

  for (const [param, target] of Object.entries(DEV_LOGIN_PARAMS)) {
    const value = current.searchParams.get(param);
    if (value) {
      session.searchParams.set(target, value);
    }
  }

  session.searchParams.set('redirect', devLoginReturnAddress());

  const available = await fetch(new URL('/api/dev/auth/users', environment.apiUrl))
    .then((response) => response.ok)
    .catch(() => false);

  if (!available) {
    console.warn(
      `[dev-auth] ${clientId}: /api/dev/auth is unavailable (backend not in the dev profile?), using the normal login.`,
    );
    return false;
  }

  sessionStorage.removeItem(configId);
  window.location.replace(session.toString());
  return true;
}

function devLoginReturnAddress(): string {
  const app = DeployedPath.fromBase(document.baseURI);
  return app.slug ? app.withoutLocale().toString().replace(/\/+$/, '') : app.toString();
}
