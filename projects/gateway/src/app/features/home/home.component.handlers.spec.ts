import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

describe('HomeComponent handlers', () => {
  it('navigates to admin preserving en locale', async () => {
    const doc = makeDocument('http://localhost/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: DOCUMENT, useValue: doc },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    }).compileComponents();

    const comp = TestBed.createComponent(HomeComponent).componentInstance;
    comp.onCardSelect({ id: 'admin', title: '', description: '', ariaLabel: '', href: 'admin/' });

    expect(doc.location.href).toBe('http://localhost/admin/en/');
  });

  it('navigates to operator preserving en locale', async () => {
    const doc = makeDocument('http://localhost/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: DOCUMENT, useValue: doc },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    }).compileComponents();

    const comp = TestBed.createComponent(HomeComponent).componentInstance;
    comp.onCardSelect({
      id: 'operator-mobile',
      title: '',
      description: '',
      ariaLabel: '',
      href: 'operator/',
    });

    expect(doc.location.href).toBe('http://localhost/operator/en/');
  });

  it('preserves ru locale on GitHub Pages', async () => {
    const doc = makeDocument('https://jenkaby.github.io/bikerental-ui/ru/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: DOCUMENT, useValue: doc },
        { provide: LOCALE_ID, useValue: 'ru' },
      ],
    }).compileComponents();

    const comp = TestBed.createComponent(HomeComponent).componentInstance;
    comp.onCardSelect({ id: 'admin', title: '', description: '', ariaLabel: '', href: 'admin/' });

    expect(doc.location.href).toBe('https://jenkaby.github.io/bikerental-ui/admin/ru/');
  });

  it('navigates correctly on GitHub Pages with en locale', async () => {
    const doc = makeDocument('https://jenkaby.github.io/bikerental-ui/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: DOCUMENT, useValue: doc },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    }).compileComponents();

    const comp = TestBed.createComponent(HomeComponent).componentInstance;
    comp.onCardSelect({ id: 'admin', title: '', description: '', ariaLabel: '', href: 'admin/' });

    expect(doc.location.href).toBe('https://jenkaby.github.io/bikerental-ui/admin/en/');
  });
});
