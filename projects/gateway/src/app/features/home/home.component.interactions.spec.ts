import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomeComponent } from './home.component';

describe('HomeComponent interactions', () => {
  let locationMock: { href: string };

  beforeEach(() => {
    locationMock = { href: '' };
    Object.defineProperty(window, 'location', { value: locationMock, writable: true });
  });

  it('activate event on admin card navigates to /admin/', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const cardDe = fixture.debugElement.queryAll(By.css('app-dashboard-card'))[0];
    expect(cardDe).toBeTruthy();

    cardDe.triggerEventHandler('activate', null);
    fixture.detectChanges();

    expect(locationMock.href).toBe('/admin/');
  });

  it('activate event on operator-mobile card navigates to /operator/', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const cardDe = fixture.debugElement.queryAll(By.css('app-dashboard-card'))[1];
    expect(cardDe).toBeTruthy();

    cardDe.triggerEventHandler('activate', null);
    fixture.detectChanges();

    expect(locationMock.href).toBe('/operator/');
  });
});
