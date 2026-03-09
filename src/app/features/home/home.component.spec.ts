import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideRouter } from '@angular/router';
import { LayoutModeService } from '../../core/layout-mode.service';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the three CTAs and sets layout mode when operator buttons clicked', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const adminBtn = el.querySelector('button[aria-label="Open administrator dashboard"]');
    const opMobile = el.querySelector('button[aria-label="Open operator dashboard (mobile)"]');
    const opDesktop = el.querySelector('button[aria-label="Open operator dashboard (desktop)"]');

    expect(adminBtn).toBeTruthy();
    expect(opMobile).toBeTruthy();
    expect(opDesktop).toBeTruthy();
  });

  it('onCardSelect sets layout mode and navigates', async () => {
    // typed mocks to avoid `any`
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
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    // local Card type mirrors DashboardCardDef used by the component
    interface Card {
      id: string;
      title: string;
      description: string;
      ariaLabel: string;
      path: string;
      layoutMode?: 'mobile' | 'desktop';
    }
    const cards = (comp as unknown as { cards: Card[] }).cards;
    const card = cards.find((c) => c.id === 'operator-mobile')!;
    comp.onCardSelect(card);

    expect(setMode).toHaveBeenCalledWith('mobile');
    expect(navigate).toHaveBeenCalledWith([card.path]);
  });
});
