import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { APP_BRAND, BRAND, AuthService } from '@bikerental/shared';

const makeAuthService = () => ({
  logout: vi.fn(),
});

describe('AdminLayoutComponent', () => {
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: APP_BRAND, useValue: BRAND },
        { provide: AuthService, useValue: makeAuthService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the shell', () => {
    expect(fixture.nativeElement.querySelector('app-shell')).toBeTruthy();
  });

  it('should render the health indicator', () => {
    expect(fixture.nativeElement.querySelector('app-health-indicator')).toBeTruthy();
  });
});

describe('AdminLayoutComponent handlers', () => {
  it('onToggleSidebar toggles sidenavOpened signal', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: APP_BRAND, useValue: BRAND },
        { provide: AuthService, useValue: makeAuthService() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminLayoutComponent);
    const comp = fixture.componentInstance;
    const initial = (comp as unknown as { sidenavOpened: () => boolean }).sidenavOpened();
    (comp as unknown as { onToggleSidebar: () => void }).onToggleSidebar();
    expect((comp as unknown as { sidenavOpened: () => boolean }).sidenavOpened()).toBe(!initial);
  });

  it('onLogout calls auth.logout', async () => {
    const authService = makeAuthService();
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: APP_BRAND, useValue: BRAND },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminLayoutComponent);
    const comp = fixture.componentInstance;
    (comp as unknown as { onLogout: () => void }).onLogout();
    expect(authService.logout).toHaveBeenCalled();
  });
});
