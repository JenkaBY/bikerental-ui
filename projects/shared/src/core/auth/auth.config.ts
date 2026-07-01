import { EnvironmentProviders } from '@angular/core';
import { LogLevel, provideAuth } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';

const CALLBACK_PATH = 'login/callback';

export function provideOidcAuth(clientId: string): EnvironmentProviders {
  const appBaseUrl = document.baseURI.endsWith('/') ? document.baseURI : `${document.baseURI}/`;

  return provideAuth({
    config: {
      authority: environment.apiUrl,
      clientId,
      redirectUrl: new URL(CALLBACK_PATH, appBaseUrl).href,
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
