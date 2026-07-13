import { describe, expect, it } from 'vitest';
import { DeployedPath, localeSegment } from './deployed-path';

describe('DeployedPath.fromBase — parsing', () => {
  it('parses a dev-server base (no prefix, no locale segment)', () => {
    const dp = DeployedPath.fromBase('http://localhost:4200/operator/');
    expect(dp.origin).toBe('http://localhost:4200');
    expect(dp.app).toBe('operator');
    expect(dp.locale).toBeUndefined();
  });

  it('parses a GitHub Pages base (repo prefix + app + locale)', () => {
    const dp = DeployedPath.fromBase('https://jenkaby.github.io/bikerental-ui/admin/ru/');
    expect(dp.origin).toBe('https://jenkaby.github.io');
    expect(dp.app).toBe('admin');
    expect(dp.locale).toBe('ru');
  });

  it('parses a gateway base (prefix + locale, no app segment)', () => {
    const dp = DeployedPath.fromBase('https://jenkaby.github.io/bikerental-ui/en/');
    expect(dp.app).toBeUndefined();
    expect(dp.locale).toBe('en');
  });

  it('parses a bare root base (gateway dev)', () => {
    const dp = DeployedPath.fromBase('http://localhost/');
    expect(dp.app).toBeUndefined();
    expect(dp.locale).toBeUndefined();
  });
});

describe('DeployedPath.withApp — cross-app links (the customer-transactions → rental bug)', () => {
  it('REGRESSION: swaps admin→operator on GitHub Pages without duplicating the prefix', () => {
    const url = DeployedPath.fromBase('https://jenkaby.github.io/bikerental-ui/admin/ru/')
      .withApp('operator')
      .withRoute('rentals/37')
      .toString();
    expect(url).toBe('https://jenkaby.github.io/bikerental-ui/operator/ru/rentals/37');
    expect(url).not.toContain('/operator/bikerental-ui/');
  });

  it('REGRESSION: self-links operator→operator on GitHub Pages (the reported broken link)', () => {
    const url = DeployedPath.fromBase('https://jenkaby.github.io/bikerental-ui/operator/ru/')
      .withApp('operator')
      .withRoute('rentals/37')
      .toString();
    expect(url).toBe('https://jenkaby.github.io/bikerental-ui/operator/ru/rentals/37');
  });

  it('keeps the en locale segment when swapping apps', () => {
    const url = DeployedPath.fromBase('https://jenkaby.github.io/bikerental-ui/admin/en/')
      .withApp('operator')
      .withRoute('rentals/37')
      .toString();
    expect(url).toBe('https://jenkaby.github.io/bikerental-ui/operator/en/rentals/37');
  });

  it('works on the dev server (no prefix, no locale segment)', () => {
    expect(
      DeployedPath.fromBase('http://localhost:4200/admin/')
        .withApp('operator')
        .withRoute('rentals/37')
        .toString(),
    ).toBe('http://localhost:4200/operator/rentals/37');
  });
});

describe('DeployedPath.withRoute', () => {
  it('strips a leading slash to avoid a double slash', () => {
    expect(
      DeployedPath.fromBase('http://localhost:4200/operator/').withRoute('/rentals/37').toString(),
    ).toBe('http://localhost:4200/operator/rentals/37');
  });
});

describe('DeployedPath.fromLocation + withLocale — locale switch', () => {
  it('swaps the locale segment while preserving app, route, query and hash on prod', () => {
    const url = DeployedPath.fromLocation(
      'https://jenkaby.github.io/bikerental-ui/operator/ru/',
      'https://jenkaby.github.io/bikerental-ui/operator/ru/rentals/37?q=1#h',
    )
      .withLocale('en')
      .toString();
    expect(url).toBe('https://jenkaby.github.io/bikerental-ui/operator/en/rentals/37?q=1#h');
  });

  it('swaps admin en→ru preserving the current route', () => {
    const url = DeployedPath.fromLocation(
      'https://jenkaby.github.io/bikerental-ui/admin/en/',
      'https://jenkaby.github.io/bikerental-ui/admin/en/customers/9',
    )
      .withLocale('ru')
      .toString();
    expect(url).toBe('https://jenkaby.github.io/bikerental-ui/admin/ru/customers/9');
  });

  it('exposes an undefined locale on the dev server so callers can no-op', () => {
    const dp = DeployedPath.fromLocation(
      'http://localhost:4200/operator/',
      'http://localhost:4200/operator/rentals/37',
    );
    expect(dp.locale).toBeUndefined();
  });

  it('drops the route when the location is not under the base path', () => {
    const url = DeployedPath.fromLocation(
      'https://jenkaby.github.io/bikerental-ui/admin/en/',
      'https://jenkaby.github.io/somewhere/else/',
    )
      .withLocale('ru')
      .toString();
    expect(url).toBe('https://jenkaby.github.io/bikerental-ui/admin/ru/');
  });
});

describe('DeployedPath — gateway navigation (base has no app segment)', () => {
  it('inserts the app between prefix and locale on GitHub Pages', () => {
    const url = DeployedPath.fromBase('https://jenkaby.github.io/bikerental-ui/ru/')
      .withApp('admin')
      .withLocale('ru')
      .toString();
    expect(url).toBe('https://jenkaby.github.io/bikerental-ui/admin/ru/');
  });

  it('builds an app URL with a trailing slash on the dev server', () => {
    const url = DeployedPath.fromBase('http://localhost/en/')
      .withApp('operator')
      .withLocale('en')
      .toString();
    expect(url).toBe('http://localhost/operator/en/');
  });
});

describe('localeSegment', () => {
  it('maps Angular locale codes to URL segments', () => {
    expect(localeSegment('en-US')).toBe('en');
    expect(localeSegment('en')).toBe('en');
    expect(localeSegment('ru')).toBe('ru');
  });

  it('returns undefined for an unknown locale', () => {
    expect(localeSegment('de')).toBeUndefined();
  });
});
