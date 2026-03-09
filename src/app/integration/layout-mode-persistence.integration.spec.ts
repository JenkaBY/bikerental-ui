import { TestBed } from '@angular/core/testing';
import { LayoutModeToggleComponent } from '../shared/components/layout-mode-toggle/layout-mode-toggle.component';
import { LayoutModeService } from '../core/layout-mode.service';

describe('Layout mode persistence (integration)', () => {
  const STORAGE_KEY = 'bikerental.operatorLayoutMode';

  beforeEach(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      void err;
    }
  });

  it('persists toggle choice across simulated page reload', async () => {
    // Boot a small "app" that includes the toggle and the service
    await TestBed.configureTestingModule({
      imports: [LayoutModeToggleComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(LayoutModeToggleComponent);
    fixture.detectChanges();

    const svc = TestBed.inject(LayoutModeService);
    // initial mode should be mobile (default)
    expect(svc.mode()).toBe('mobile');

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();

    // Click the toggle to switch to desktop
    btn!.click();
    fixture.detectChanges();

    // Service should reflect the new mode and localStorage should be set
    expect(svc.mode()).toBe('desktop');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('desktop');

    // Simulate a page reload by resetting the TestBed (new injector) and reading the service again
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ providers: [LayoutModeService] }).compileComponents();
    const svcAfterReload = TestBed.inject(LayoutModeService);
    expect(svcAfterReload.mode()).toBe('desktop');
  });
});
