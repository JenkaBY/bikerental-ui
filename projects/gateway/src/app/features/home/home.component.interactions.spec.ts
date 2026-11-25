import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

async function setup() {
  const doc = makeDocument('https://jenkaby.github.io/bikerental-ui/en/');
  await TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [
      { provide: DOCUMENT, useValue: doc },
      { provide: APP_BRAND, useValue: BRAND },
      { provide: LOCALE_ID, useValue: 'en-US' },
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

function cardButtons(fixture: ComponentFixture<HomeComponent>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('app-dashboard-card button'));
}

describe('HomeComponent interactions', () => {
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

  it('keeps business cards disabled until a valid slug is typed', async () => {
    const { fixture } = await setup();

    expect(cardButtons(fixture).map((b) => b.disabled)).toEqual([true, true, false]);

    typeSlug(fixture, 'velo-riga');

    expect(cardButtons(fixture).map((b) => b.disabled)).toEqual([false, false, false]);
  });

  it('activate on admin card navigates to the business admin on GitHub Pages', async () => {
    const { doc, fixture } = await setup();
    typeSlug(fixture, 'velo-riga');

    fixture.debugElement
      .queryAll(By.css('app-dashboard-card'))[0]
      .triggerEventHandler('activate', null);

    expect(doc.location.href).toBe('https://jenkaby.github.io/bikerental-ui/velo-riga/admin/en/');
  });

  it('activate on operator card navigates to the business operator on GitHub Pages', async () => {
    const { doc, fixture } = await setup();
    typeSlug(fixture, 'velo-riga');

    fixture.debugElement
      .queryAll(By.css('app-dashboard-card'))[1]
      .triggerEventHandler('activate', null);

    expect(doc.location.href).toBe(
      'https://jenkaby.github.io/bikerental-ui/velo-riga/operator/en/',
    );
  });

  it('submitting the slug form navigates to the business admin', async () => {
    const { doc, fixture } = await setup();
    typeSlug(fixture, 'velo-riga');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));

    expect(doc.location.href).toBe('https://jenkaby.github.io/bikerental-ui/velo-riga/admin/en/');
  });
});
