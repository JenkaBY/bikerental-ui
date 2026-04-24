import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomeComponent } from './home.component';

function makeDocument(baseURI: string) {
  const locationMock = { href: '' };
  return new Proxy(document, {
    get(target, prop: string) {
      if (prop === 'baseURI') return baseURI;
      if (prop === 'location') return locationMock;
      const value = (target as unknown as Record<string, unknown>)[prop];
      return typeof value === 'function'
        ? (value as (...a: unknown[]) => unknown).bind(target)
        : value;
    },
  }) as Document & { location: { href: string } };
}

describe('HomeComponent interactions', () => {
  it('activate on admin card navigates to admin/en/ on GitHub Pages', async () => {
    const doc = makeDocument('https://jenkaby.github.io/bikerental-ui/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: DOCUMENT, useValue: doc },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.debugElement
      .queryAll(By.css('app-dashboard-card'))[0]
      .triggerEventHandler('activate', null);

    expect(doc.location.href).toBe('https://jenkaby.github.io/bikerental-ui/admin/en/');
  });

  it('activate on operator-mobile card navigates to operator/en/ on GitHub Pages', async () => {
    const doc = makeDocument('https://jenkaby.github.io/bikerental-ui/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: DOCUMENT, useValue: doc },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.debugElement
      .queryAll(By.css('app-dashboard-card'))[1]
      .triggerEventHandler('activate', null);

    expect(doc.location.href).toBe('https://jenkaby.github.io/bikerental-ui/operator/en/');
  });
});
