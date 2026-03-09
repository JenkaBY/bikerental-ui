import { TestBed } from '@angular/core/testing';
import { AppToolbarComponent } from './app-toolbar.component';

describe('AppToolbarComponent handlers', () => {
  it('goHome calls router.navigate with /', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };

    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [{ provide: (await import('@angular/router')).Router, useValue: mockRouter }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppToolbarComponent);
    const comp = fixture.componentInstance;

    comp.goHome();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});

describe('AppToolbarComponent handlers (direct)', () => {
  it('goHome navigates to root', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };

    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [{ provide: (await import('@angular/router')).Router, useValue: mockRouter }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppToolbarComponent);
    const comp = fixture.componentInstance;

    comp.goHome();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
