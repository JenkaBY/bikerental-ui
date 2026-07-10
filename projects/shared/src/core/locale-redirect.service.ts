import { Injectable } from '@angular/core';

// Angular's i18n build nests every locale (including the source one) under its own
// subdirectory named by this segment — e.g. GitHub Pages serves .../operator/en/ and
// .../operator/ru/ side by side. Map each app-facing language code to that segment.
const LOCALE_URL_SEGMENT: Readonly<Record<string, string>> = {
  'en-US': 'en',
  en: 'en',
  ru: 'ru',
};

const KNOWN_URL_SEGMENTS = new Set(Object.values(LOCALE_URL_SEGMENT));

@Injectable({ providedIn: 'root' })
export class LocaleRedirectService {
  redirect(targetLocale: string): void {
    const targetSegment = LOCALE_URL_SEGMENT[targetLocale];
    if (targetSegment === undefined) {
      return;
    }

    // <base href> reflects the actual deployed app root for the CURRENT locale build
    // (e.g. "/bikerental-ui/operator/en/" in prod, "/operator/" in dev where the
    // dev server only ever serves a single, non-nested locale).
    const basePathname = new URL(document.baseURI).pathname;
    const baseSegments = basePathname.split('/').filter(Boolean);
    const lastSegment = baseSegments[baseSegments.length - 1];
    const appRootSegments = KNOWN_URL_SEGMENTS.has(lastSegment)
      ? baseSegments.slice(0, -1)
      : baseSegments;

    const currentPathname = window.location.pathname;
    const relativePath = currentPathname.startsWith(basePathname)
      ? currentPathname.slice(basePathname.length)
      : '';

    const targetPathname = `/${[...appRootSegments, targetSegment].join('/')}/${relativePath}`;
    const targetUrl =
      window.location.origin + targetPathname + window.location.search + window.location.hash;
    window.location.assign(targetUrl);
  }
}
