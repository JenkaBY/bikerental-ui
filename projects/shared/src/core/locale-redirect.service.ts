import { inject, Injectable, LOCALE_ID } from '@angular/core';

const SUPPORTED_LOCALE_PREFIX: Readonly<Record<string, string>> = {
  'en-US': '',
  en: '',
  ru: '/ru',
};

@Injectable({ providedIn: 'root' })
export class LocaleRedirectService {
  private readonly localeId = inject(LOCALE_ID);

  redirect(targetLocale: string): void {
    const targetPrefix = SUPPORTED_LOCALE_PREFIX[targetLocale];
    if (targetPrefix === undefined) {
      return;
    }

    const currentPrefix = SUPPORTED_LOCALE_PREFIX[this.localeId] ?? '';
    const currentPathname = window.location.pathname;
    const strippedPathname =
      currentPrefix && currentPathname.startsWith(currentPrefix)
        ? currentPathname.slice(currentPrefix.length)
        : currentPathname;

    const targetUrl = window.location.origin + targetPrefix + strippedPathname;
    window.location.assign(targetUrl);
  }
}
