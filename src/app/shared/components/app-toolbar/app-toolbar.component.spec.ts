import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AppToolbarComponent } from './app-toolbar.component';

@Component({
  standalone: true,
  imports: [AppToolbarComponent],
  template: `
    <app-toolbar title="Test Title" [showToggle]="false">
      <button data-testid="action-btn">Action</button>
    </app-toolbar>
  `,
})
class HostComponent {}

@Component({
  standalone: true,
  imports: [AppToolbarComponent],
  template: `
    <app-toolbar title="Test Title" [showToggle]="true" [menuOpen]="menuOpen">
      <button data-testid="logout-btn">Logout</button>
    </app-toolbar>
  `,
})
class HostWithToggleComponent {
  menuOpen = false;
}

describe('AppToolbarComponent', () => {
  describe('projected content visibility', () => {
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [],
      }).compileComponents();

      fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
    });

    it('should render projected action button', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="action-btn"]');
      expect(btn).toBeTruthy();
    });

    it('should not have overflow-hidden on mat-toolbar (prevents clipping projected content)', () => {
      const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
      expect(toolbar).toBeTruthy();
      expect(toolbar.classList).not.toContain('overflow-hidden');
    });

    it('mat-toolbar should not have w-full class that causes overflow on sidenav toggle', () => {
      const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
      expect(toolbar.classList).not.toContain('w-full');
    });
  });

  describe('title flex layout', () => {
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [],
      }).compileComponents();

      fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
    });

    it('title span should not use shrink-0 which prevents yielding space to projected content', () => {
      const titleSpan: HTMLElement = fixture.nativeElement.querySelector(
        'mat-toolbar span.truncate',
      );
      expect(titleSpan).toBeTruthy();
      expect(titleSpan.classList).not.toContain('shrink-0');
    });

    it('title span should use flex-1 to allow projected content to remain visible', () => {
      const titleSpan: HTMLElement = fixture.nativeElement.querySelector(
        'mat-toolbar span.truncate',
      );
      expect(titleSpan).toBeTruthy();
      expect(titleSpan.classList).toContain('flex-1');
    });

    it('should not have duplicate spacer span that pushes projected content out', () => {
      const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
      const spans = toolbar.querySelectorAll(':scope > span');
      // Only the title span — no extra empty spacer span
      expect(spans.length).toBe(1);
    });
  });

  describe('toggle button', () => {
    let fixture: ComponentFixture<HostWithToggleComponent>;
    let component: HostWithToggleComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithToggleComponent],
        providers: [],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithToggleComponent);
      component = fixture.componentInstance;
    });

    it('should show toggle button when showToggle is true', () => {
      fixture.detectChanges();
      const toggle = fixture.nativeElement.querySelector('app-toggle-button');
      expect(toggle).toBeTruthy();
    });

    it('should render projected logout button alongside toggle button', () => {
      fixture.detectChanges();
      const logoutBtn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(logoutBtn).toBeTruthy();
    });

    it('should still show projected content when menu is open', () => {
      component.menuOpen = true;
      fixture.detectChanges();

      const logoutBtn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(logoutBtn).toBeTruthy();
    });

    it('should still show projected content when menu is closed', () => {
      component.menuOpen = false;
      fixture.detectChanges();

      const logoutBtn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(logoutBtn).toBeTruthy();
    });
  });
});
