import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { LayoutModeService } from '../../core/layout-mode.service';

describe('HomeComponent handlers (direct)', () => {
  it('onCardSelect sets layout and navigates when layoutMode provided', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };
    const setMode = vi.fn();
    const mockLayout: { setMode: (mode: 'mobile' | 'desktop' | string) => unknown } = { setMode };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: (await import('@angular/router')).Router, useValue: mockRouter },
        { provide: LayoutModeService, useValue: mockLayout },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;

    const card: {
      id: string;
      title: string;
      description: string;
      ariaLabel: string;
      path: string;
      layoutMode?: 'mobile' | 'desktop';
    } = {
      id: 'op',
      title: 'x',
      description: 'd',
      ariaLabel: 'a',
      path: '/operator',
      layoutMode: 'mobile',
    };

    comp.onCardSelect(card);

    expect(setMode).toHaveBeenCalledWith('mobile');
    expect(navigate).toHaveBeenCalledWith(['/operator']);
  });

  it('onCardSelect navigates when no layoutMode provided', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };
    const setMode = vi.fn();
    const mockLayout: { setMode: (mode: 'mobile' | 'desktop' | string) => unknown } = { setMode };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: (await import('@angular/router')).Router, useValue: mockRouter },
        { provide: LayoutModeService, useValue: mockLayout },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;

    const card: {
      id: string;
      title: string;
      description: string;
      ariaLabel: string;
      path: string;
    } = {
      id: 'admin',
      title: 'Admin',
      description: 'd',
      ariaLabel: 'a',
      path: '/admin',
    };

    comp.onCardSelect(card);

    expect(setMode).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });
});
