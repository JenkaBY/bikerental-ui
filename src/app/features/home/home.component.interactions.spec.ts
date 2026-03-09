import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomeComponent } from './home.component';
import { LayoutModeService } from '../../core/layout-mode.service';

describe('HomeComponent interactions', () => {
  it('dispatch activate event triggers onCardSelect and navigates and sets layout', async () => {
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

    // Find the first app-dashboard-card (operator-mobile)
    const cardDe = fixture.debugElement.queryAll(By.css('app-dashboard-card'))[1];
    expect(cardDe).toBeTruthy();

    // Trigger the Angular output handler for 'activate'
    cardDe.triggerEventHandler('activate', null);
    fixture.detectChanges();

    // Expect the layout.setMode called with 'mobile'
    expect(setMode).toHaveBeenCalledWith('mobile');
    // Expect navigation called
    expect(navigate).toHaveBeenCalled();
  });
});
