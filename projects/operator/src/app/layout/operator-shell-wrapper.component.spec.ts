import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OperatorShellWrapperComponent } from './operator-shell-wrapper.component';
import { APP_BRAND, BRAND, LayoutModeService } from '@bikerental/shared';

describe('OperatorShellWrapperComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorShellWrapperComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();
  });

  it('renders operator layout when mobile', () => {
    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('mobile');
    const fixture = TestBed.createComponent(OperatorShellWrapperComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-operator-layout')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-shell')).toBeFalsy();
  });

  it('renders shell when desktop', () => {
    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('desktop');
    const fixture = TestBed.createComponent(OperatorShellWrapperComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-shell')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-operator-layout')).toBeFalsy();
  });
});
