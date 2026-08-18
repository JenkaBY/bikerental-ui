import { EnvironmentProviders } from '@angular/core';
import { LogLevel, provideAuth } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';

interface StoredOidcState {
  authWellKnownEndPoints?: { issuer?: string };
}

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

function purgeStaleWellKnownEndpoints(configId: string): void {
  const raw = sessionStorage.getItem(configId);

  if (!raw) {
    return;
  }

  try {
    const issuer = (JSON.parse(raw) as StoredOidcState).authWellKnownEndPoints?.issuer;

    if (issuer && stripTrailingSlash(issuer) !== stripTrailingSlash(environment.apiUrl)) {
      sessionStorage.removeItem(configId);
    }
  } catch {
    sessionStorage.removeItem(configId);
  }
}

export function provideOidcAuth(clientId: string): EnvironmentProviders {
  const appBaseUrl = document.baseURI.endsWith('/') ? document.baseURI : `${document.baseURI}/`;
  const configId = `oidc-${clientId}`;

  purgeStaleWellKnownEndpoints(configId);

  return provideAuth({
    config: {
      configId,
      authority: environment.apiUrl,
      clientId,
      redirectUrl: appBaseUrl,
      postLogoutRedirectUri: appBaseUrl,
      responseType: 'code',
      scope: 'openid profile offline_access',
      useRefreshToken: true,
      silentRenew: true,
      renewTimeBeforeTokenExpiresInSeconds: 30,
      logLevel: environment.production ? LogLevel.Error : LogLevel.Warn,
    },
  });
}
