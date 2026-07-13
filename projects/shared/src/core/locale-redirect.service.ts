import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { DeployedPath, localeSegment } from '../shared/utils/deployed-path';

@Injectable({ providedIn: 'root' })
export class LocaleRedirectService {
  private readonly document = inject(DOCUMENT);

  redirect(targetLocale: string): void {
    const targetSegment = localeSegment(targetLocale);
    if (targetSegment === undefined) {
      return;
    }

    // The dev server serves a single, non-nested locale ("/operator/") with no segment
    // to swap, so `locale` is undefined there — bail out instead of building a URL the
    // dev server can't serve. On GitHub Pages the base carries the current locale segment.
    const current = DeployedPath.fromLocation(this.document.baseURI, this.document.location.href);
    if (current.locale === undefined || current.locale === targetSegment) {
      return;
    }

    this.document.location.assign(current.withLocale(targetSegment).toString());
  }
}
