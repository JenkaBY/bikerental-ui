import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BRAND, BRAND, environment } from '@bikerental/shared';
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

const card = (app: string) => ({ id: app, title: '', description: '', ariaLabel: '', app });

async function setup(baseURI: string, locale: string) {
  const doc = makeDocument(baseURI);
  await TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [
      { provide: DOCUMENT, useValue: doc },
      { provide: APP_BRAND, useValue: BRAND },
      { provide: LOCALE_ID, useValue: locale },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(HomeComponent);
  fixture.detectChanges();
  return { doc, fixture };
}

function typeSlug(fixture: ComponentFixture<HomeComponent>, value: string): void {
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('HomeComponent handlers', () => {
  const templates = {
    admin: environment.adminAddressTemplate,
    operator: environment.operatorAddressTemplate,
  };

  beforeEach(() => {
    environment.adminAddressTemplate = '';
    environment.operatorAddressTemplate = '';
  });

  afterEach(() => {
    environment.adminAddressTemplate = templates.admin;
    environment.operatorAddressTemplate = templates.operator;
  });

  it('navigates to the business admin preserving en locale', async () => {
    const { doc, fixture } = await setup('http://localhost/en/', 'en-US');
    typeSlug(fixture, 'velo-riga');

    fixture.componentInstance.onCardSelect(card('admin'));

    expect(doc.location.href).toBe('http://localhost/velo-riga/admin/en/');
  });

  it('navigates to the business operator, lowercasing the typed slug', async () => {
    const { doc, fixture } = await setup('http://localhost/en/', 'en-US');
    typeSlug(fixture, '  Velo-Riga ');

    fixture.componentInstance.onCardSelect(card('operator'));

    expect(doc.location.href).toBe('http://localhost/velo-riga/operator/en/');
  });

  it('preserves ru locale and the repository prefix on GitHub Pages', async () => {
    const { doc, fixture } = await setup('https://jenkaby.github.io/bikerental-ui/ru/', 'ru');
    typeSlug(fixture, 'velo-riga');

    fixture.componentInstance.onCardSelect(card('admin'));

    expect(doc.location.href).toBe('https://jenkaby.github.io/bikerental-ui/velo-riga/admin/ru/');
  });

  it('does not navigate to a business app without a valid slug', async () => {
    const { doc, fixture } = await setup('http://localhost/en/', 'en-US');
    typeSlug(fixture, 'velo riga!');

    fixture.componentInstance.onCardSelect(card('admin'));

    expect(doc.location.href).toBe('');
  });

  it('navigates to the platform without a slug', async () => {
    const { doc, fixture } = await setup('http://localhost/en/', 'en-US');

    fixture.componentInstance.onCardSelect(card('platform'));

    expect(doc.location.href).toBe('http://localhost/platform/en/');
  });

  it('uses the configured address template when set', async () => {
    environment.adminAddressTemplate = 'http://localhost:4201/{slug}/admin';
    const { doc, fixture } = await setup('http://localhost:4200/', 'en-US');
    typeSlug(fixture, 'velo-riga');

    fixture.componentInstance.onCardSelect(card('admin'));

    expect(doc.location.href).toBe('http://localhost:4201/velo-riga/admin');
  });
});
