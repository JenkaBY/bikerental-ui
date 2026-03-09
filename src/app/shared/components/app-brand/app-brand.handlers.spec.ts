import { TestBed } from '@angular/core/testing';
import { AppBrandComponent } from './app-brand.component';
import { APP_BRAND, BRAND } from '../../../app.tokens';

describe('AppBrandComponent handlers', () => {
  it('goHome calls router.navigate with /', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };

    await TestBed.configureTestingModule({
      imports: [AppBrandComponent],
      providers: [
        { provide: (await import('@angular/router')).Router, useValue: mockRouter },
        { provide: APP_BRAND, useValue: BRAND },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppBrandComponent);
    const comp = fixture.componentInstance;

    comp.goHome();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
