import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

function makeDocument(pathname: string, baseURI = 'http://localhost/') {
  const locationMock = { href: '', pathname };
  return new Proxy(document, {
    get(target, prop: string) {
      if (prop === 'baseURI') return baseURI;
      if (prop === 'location') return locationMock;
      const value = (target as unknown as Record<string, unknown>)[prop];
      return typeof value === 'function' ? (value as Function).bind(target) : value;
    },
  }) as Document & { location: { href: string; pathname: string } };
}

describe('HomeComponent handlers', () => {
  it('navigates to admin with current locale', async () => {
    const doc = makeDocument('/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }],
    }).compileComponents();

    const comp = TestBed.createComponent(HomeComponent).componentInstance;
    comp.onCardSelect({ id: 'admin', title: '', description: '', ariaLabel: '', href: 'admin/' });

    expect(doc.location.href).toBe('http://localhost/admin/en/');
  });

  it('navigates to operator with current locale', async () => {
    const doc = makeDocument('/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }],
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

  it('preserves ru locale', async () => {
    const doc = makeDocument('/bikerental-ui/ru/', 'http://localhost/bikerental-ui/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }],
    }).compileComponents();

    const comp = TestBed.createComponent(HomeComponent).componentInstance;
    comp.onCardSelect({ id: 'admin', title: '', description: '', ariaLabel: '', href: 'admin/' });

    expect(doc.location.href).toBe('http://localhost/bikerental-ui/admin/ru/');
  });

  it('falls back to en when locale missing', async () => {
    const doc = makeDocument('/bikerental-ui/', 'http://localhost/bikerental-ui/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }],
    }).compileComponents();

    const comp = TestBed.createComponent(HomeComponent).componentInstance;
    comp.onCardSelect({ id: 'admin', title: '', description: '', ariaLabel: '', href: 'admin/' });

    expect(doc.location.href).toBe('http://localhost/bikerental-ui/admin/en/');
  });
});
