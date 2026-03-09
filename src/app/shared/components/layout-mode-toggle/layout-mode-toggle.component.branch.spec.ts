import { TestBed } from '@angular/core/testing';
import { LayoutModeToggleComponent } from './layout-mode-toggle.component';
import { LayoutModeService } from '../../../core/layout-mode.service';

describe('LayoutModeToggleComponent branches', () => {
  it('renders smartphone icon when mode is mobile', async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutModeToggleComponent],
    }).compileComponents();

    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('mobile');

    const fixture = TestBed.createComponent(LayoutModeToggleComponent);
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent!.trim()).toBe('smartphone');
  });

  it('renders desktop icon when mode is desktop', async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutModeToggleComponent],
    }).compileComponents();

    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('desktop');

    const fixture = TestBed.createComponent(LayoutModeToggleComponent);
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent!.trim()).toBe('desktop_windows');
  });
});
