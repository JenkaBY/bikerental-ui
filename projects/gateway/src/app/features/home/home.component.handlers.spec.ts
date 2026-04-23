import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent handlers (direct)', () => {
  let locationMock: { href: string };

  beforeEach(() => {
    locationMock = { href: '' };
    Object.defineProperty(window, 'location', { value: locationMock, writable: true });
  });

  it('onCardSelect sets window.location.href to card href', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;

    comp.onCardSelect({
      id: 'admin',
      title: 'Admin',
      description: 'd',
      ariaLabel: 'a',
      href: '/admin/',
    });

    expect(locationMock.href).toBe('/admin/');
  });

  it('onCardSelect navigates to /operator/ for operator card', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;

    comp.onCardSelect({
      id: 'operator-mobile',
      title: 'Operator',
      description: 'd',
      ariaLabel: 'a',
      href: '/operator/',
    });

    expect(locationMock.href).toBe('/operator/');
  });
});
