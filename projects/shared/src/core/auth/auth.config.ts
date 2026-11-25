import { EnvironmentProviders } from '@angular/core';
import {
  LogLevel,
  OpenIdConfiguration,
  provideAuth,
  StsConfigLoader,
  StsConfigStaticLoader,
} from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';
import { DeployedPath } from '../../shared/utils/deployed-path';
import { startDevLoginIfRequested } from './dev-login';

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

interface ReturnAddresses {
  redirectUrl: string;
  postLogoutRedirectUri: string;
}

function returnAddresses(): ReturnAddresses {
  const app = DeployedPath.fromBase(document.baseURI);

  if (app.slug) {
    const businessApp = app.withoutLocale();
    return {
      redirectUrl: businessApp.withRoute('login/callback').toString(),
      postLogoutRedirectUri: stripTrailingSlash(businessApp.toString()),
    };
  }

  const appBaseUrl = document.baseURI.endsWith('/') ? document.baseURI : `${document.baseURI}/`;
  return { redirectUrl: appBaseUrl, postLogoutRedirectUri: appBaseUrl };
}

export function provideOidcAuth(clientId: string): EnvironmentProviders {
  return provideAuth({
    loader: {
      provide: StsConfigLoader,
      useFactory: () => new StsConfigStaticLoader(oidcConfig(clientId)),
    },
  });
}

function oidcConfig(clientId: string): OpenIdConfiguration {
  const slug = DeployedPath.fromBase(document.baseURI).slug;
  const configId = slug ? `oidc-${clientId}-${slug}` : `oidc-${clientId}`;

  purgeStaleWellKnownEndpoints(configId);
  startDevLoginIfRequested(clientId, configId);

  return {
    configId,
    authority: environment.apiUrl,
    clientId,
    ...returnAddresses(),
    responseType: 'code',
    scope: 'openid profile offline_access',
    useRefreshToken: true,
    silentRenew: false,
    autoUserInfo: false,
    triggerRefreshWhenIdTokenExpired: false,
    renewTimeBeforeTokenExpiresInSeconds: 10,
    logLevel: environment.production ? LogLevel.Error : LogLevel.Warn,
  };
}
