import { TestBed } from '@angular/core/testing';
import { OperatorLayoutComponent } from './operator-layout.component';
import { APP_BRAND, BRAND } from '../../../app.tokens';

describe('OperatorLayoutComponent handlers', () => {
  it('onLogout logs a message', async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorLayoutComponent],
      providers: [{ provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();
    const fixture = TestBed.createComponent(OperatorLayoutComponent);
    const comp = fixture.componentInstance;
    const spy = vi.spyOn(console, 'log');
    (comp as unknown as { onLogout: () => void }).onLogout();
    expect(spy).toHaveBeenCalledWith('logout requested from operator layout');
  });
});
