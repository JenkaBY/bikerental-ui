// Single source of truth for the app's deployed URL shape.
//
// Every app lives at `{origin}/{...prefix}/{app}/{locale}/{route}`, where each middle
// segment is optional and its presence depends on where the app runs:
//   dev server        →  /operator/rentals/37            (no prefix, no locale segment)
//   GitHub Pages       →  /bikerental-ui/operator/ru/rentals/37
//   gateway (no app)   →  /bikerental-ui/ru/
// `baseURI` (`<base href>`) already encodes prefix + app + locale correctly in every
// environment, so parse it once and swap only the segment you mean to change. Never
// rebuild the prefix by guessing segment positions or hardcoding it.

const APP_SEGMENTS = new Set(['admin', 'operator']);

// Angular locale code (LOCALE_ID / user preference) → the URL segment the i18n build emits.
const LOCALE_SEGMENTS: Readonly<Record<string, string>> = {
  'en-US': 'en',
  en: 'en',
  ru: 'ru',
};

const LOCALE_SEGMENT_VALUES = new Set(Object.values(LOCALE_SEGMENTS));

export function localeSegment(localeCode: string): string | undefined {
  return LOCALE_SEGMENTS[localeCode];
}

export class DeployedPath {
  private constructor(
    readonly origin: string,
    private readonly prefix: readonly string[],
    readonly app: string | undefined,
    readonly locale: string | undefined,
    private readonly route: string,
  ) {}

  static fromBase(baseURI: string): DeployedPath {
    const url = new URL(baseURI);
    const { prefix, app, locale } = parseSegments(url.pathname);
    return new DeployedPath(url.origin, prefix, app, locale, '');
  }

  static fromLocation(baseURI: string, href: string): DeployedPath {
    const base = new URL(baseURI);
    const current = new URL(href);
    const { prefix, app, locale } = parseSegments(base.pathname);
    const route = current.pathname.startsWith(base.pathname)
      ? current.pathname.slice(base.pathname.length)
      : '';
    return new DeployedPath(
      base.origin,
      prefix,
      app,
      locale,
      route + current.search + current.hash,
    );
  }

  withApp(app: string): DeployedPath {
    return new DeployedPath(this.origin, this.prefix, app, this.locale, this.route);
  }

  withLocale(locale: string): DeployedPath {
    return new DeployedPath(this.origin, this.prefix, this.app, locale, this.route);
  }

  withRoute(route: string): DeployedPath {
    return new DeployedPath(
      this.origin,
      this.prefix,
      this.app,
      this.locale,
      stripLeadingSlash(route),
    );
  }

  toString(): string {
    const segments = [...this.prefix, this.app, this.locale].filter((s): s is string => !!s);
    const basePath = segments.length ? `/${segments.join('/')}/` : '/';
    return `${this.origin}${basePath}${this.route}`;
  }
}

function parseSegments(pathname: string): {
  prefix: string[];
  app: string | undefined;
  locale: string | undefined;
} {
  const prefix: string[] = [];
  let app: string | undefined;
  let locale: string | undefined;
  for (const segment of pathname.split('/').filter(Boolean)) {
    if (app === undefined && APP_SEGMENTS.has(segment)) {
      app = segment;
    } else if (locale === undefined && LOCALE_SEGMENT_VALUES.has(segment)) {
      locale = segment;
    } else {
      prefix.push(segment);
    }
  }
  return { prefix, app, locale };
}

function stripLeadingSlash(route: string): string {
  return route.startsWith('/') ? route.slice(1) : route;
}
