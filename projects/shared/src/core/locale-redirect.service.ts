import { DOCUMENT } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';

// Angular's i18n build nests every locale (including the source one) under its own
// subdirectory named by this segment — e.g. GitHub Pages serves .../operator/en/ and
// .../operator/ru/ side by side. Map each app-facing language code to that segment.
const LOCALE_URL_SEGMENT: Readonly<Record<string, string>> = {
  'en-US': 'en',
  en: 'en',
  ru: 'ru',
};

@Injectable({ providedIn: 'root' })
export class LocaleRedirectService {
  private readonly document = inject(DOCUMENT);
  private readonly localeId = inject(LOCALE_ID);

  redirect(targetLocale: string): void {
    const targetSegment = LOCALE_URL_SEGMENT[targetLocale];
    const currentSegment = LOCALE_URL_SEGMENT[this.localeId];
    if (targetSegment === undefined || targetSegment === currentSegment) {
      return;
    }

    // The prod <base href> ends with the current locale segment (".../operator/en/");
    // the dev server serves a single, non-nested locale ("/operator/") with no segment
    // to swap — so bail out instead of building a URL the dev server can't serve.
    const basePathname = new URL(this.document.baseURI).pathname;
    if (!basePathname.endsWith(`/${currentSegment}/`)) {
      return;
    }

    const { origin, pathname, search, hash } = this.document.location;
    const targetBase = basePathname.slice(0, -(currentSegment.length + 1)) + `${targetSegment}/`;
    const route = pathname.startsWith(basePathname) ? pathname.slice(basePathname.length) : '';
    this.document.location.assign(origin + targetBase + route + search + hash);
  }
}
