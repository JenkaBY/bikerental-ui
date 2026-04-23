import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LayoutModeToggleComponent } from './layout-mode-toggle.component';
import { LayoutModeService } from '../../../core/layout-mode.service';

describe('LayoutModeToggleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutModeToggleComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders and toggles mode', () => {
    const fixture = TestBed.createComponent(LayoutModeToggleComponent);
    const svc = TestBed.inject(LayoutModeService);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();

    svc.setMode('mobile');
    fixture.detectChanges();
    expect(svc.mode()).toBe('mobile');

    btn.click();
    fixture.detectChanges();
    expect(svc.mode()).toBe('desktop');
  });
});
