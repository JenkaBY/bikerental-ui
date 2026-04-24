import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

describe('HomeComponent interactions', () => {
  it('activate on admin card navigates to admin/en/', async () => {
    const doc = makeDocument('/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.debugElement
      .queryAll(By.css('app-dashboard-card'))[0]
      .triggerEventHandler('activate', null);

    expect(doc.location.href).toBe('http://localhost/admin/en/');
  });

  it('activate on operator-mobile card navigates to operator/en/', async () => {
    const doc = makeDocument('/en/');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.debugElement
      .queryAll(By.css('app-dashboard-card'))[1]
      .triggerEventHandler('activate', null);

    expect(doc.location.href).toBe('http://localhost/operator/en/');
  });
});
