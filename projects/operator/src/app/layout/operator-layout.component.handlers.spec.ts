import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OperatorLayoutComponent } from './operator-layout.component';
import { APP_BRAND, AuthService, BRAND } from '@bikerental/shared';

const makeAuthService = () => ({
  logout: vi.fn(),
});

describe('OperatorLayoutComponent handlers', () => {
  it('onLogout calls auth.logout', async () => {
    const authService = makeAuthService();
    await TestBed.configureTestingModule({
      imports: [OperatorLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: APP_BRAND, useValue: BRAND },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OperatorLayoutComponent);
    const comp = fixture.componentInstance;
    (comp as unknown as { onLogout: () => void }).onLogout();
    expect(authService.logout).toHaveBeenCalled();
  });
});
