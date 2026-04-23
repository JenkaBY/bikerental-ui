import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OperatorLayoutComponent } from './operator-layout.component';
import { APP_BRAND, BRAND } from '@bikerental/shared';

describe('OperatorLayoutComponent', () => {
  let fixture: ComponentFixture<OperatorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorLayoutComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the toolbar', () => {
    expect(fixture.nativeElement.querySelector('app-toolbar')).toBeTruthy();
  });

  it('should render the bottom nav', () => {
    expect(fixture.nativeElement.querySelector('app-bottom-nav')).toBeTruthy();
  });

  it('should render a main content area', () => {
    expect(fixture.nativeElement.querySelector('main')).toBeTruthy();
  });

  it('should render exactly 3 bottom nav items', () => {
    const links = fixture.nativeElement.querySelectorAll('app-bottom-nav a');
    expect(links.length).toBe(3);
  });

  it('should render the health indicator in the toolbar', () => {
    expect(fixture.nativeElement.querySelector('app-health-indicator')).toBeTruthy();
  });

  it('should render the logout button in the toolbar', () => {
    expect(fixture.nativeElement.querySelector('app-logout-button')).toBeTruthy();
  });

  it('toolbar should not have a sidebar toggle button', () => {
    const toggleBtn = fixture.nativeElement.querySelector('app-toggle-button');
    expect(toggleBtn).toBeFalsy();
  });

  it('host element should have h-screen class', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('h-screen');
  });
});
