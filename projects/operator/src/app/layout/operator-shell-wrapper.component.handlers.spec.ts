import { TestBed } from '@angular/core/testing';
import { OperatorShellWrapperComponent } from './operator-shell-wrapper.component';
import { provideRouter } from '@angular/router';
import { APP_BRAND, BRAND } from '@bikerental/shared';

describe('OperatorShellWrapperComponent handlers', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorShellWrapperComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();
  });

  it('onLogout logs a message', () => {
    const fixture = TestBed.createComponent(OperatorShellWrapperComponent);
    const comp = fixture.componentInstance;
    const spy = vi.spyOn(console, 'log');
    (comp as unknown as { onLogout: () => void }).onLogout();
    expect(spy).toHaveBeenCalledWith('logout from operator wrapper');
  });
});
