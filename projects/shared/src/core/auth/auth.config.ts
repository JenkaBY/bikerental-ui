import { EnvironmentProviders } from '@angular/core';
import { LogLevel, provideAuth } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';

const CALLBACK_PATH = '/login/callback';

export function provideOidcAuth(clientId: string): EnvironmentProviders {
  const origin = window.location.origin;

  return provideAuth({
    config: {
      authority: environment.apiUrl,
      clientId,
      redirectUrl: `${origin}${CALLBACK_PATH}`,
      postLogoutRedirectUri: origin,
      responseType: 'code',
      scope: 'openid profile offline_access',
      useRefreshToken: true,
      silentRenew: true,
      renewTimeBeforeTokenExpiresInSeconds: 30,
      logLevel: environment.production ? LogLevel.Error : LogLevel.Warn,
    },
  });
}
