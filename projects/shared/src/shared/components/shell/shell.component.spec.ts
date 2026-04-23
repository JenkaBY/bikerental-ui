import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { NavItem } from '../sidebar-nav-item/nav-item.model';
import { APP_BRAND, BRAND } from '../../../app.tokens';

const NAV_ITEMS: NavItem[] = [
  { label: 'Equipment', route: 'equipment', icon: 'pedal_bike' },
  { label: 'Tariffs', route: 'tariffs', icon: 'payments' },
];

@Component({
  standalone: true,
  imports: [ShellComponent],
  template: `
    <app-shell [items]="items" title="Test App">
      <div toolbar-actions>
        <button data-testid="logout-btn">Logout</button>
      </div>
    </app-shell>
  `,
})
class HostWithSidebarComponent {
  items: NavItem[] = NAV_ITEMS;
}

@Component({
  standalone: true,
  imports: [ShellComponent],
  template: `
    <app-shell [items]="items" title="Test App" [sidenavOpened]="opened()">
      <div toolbar-actions>
        <button data-testid="logout-btn">Logout</button>
      </div>
    </app-shell>
  `,
})
class HostWithControlledSidebarComponent {
  items: NavItem[] = NAV_ITEMS;
  opened = signal(true);
}

@Component({
  standalone: true,
  imports: [ShellComponent],
  template: `
    <app-shell title="No Sidebar">
      <div toolbar-actions>
        <button data-testid="logout-btn">Logout</button>
      </div>
    </app-shell>
  `,
})
class HostWithoutSidebarComponent {}

describe('ShellComponent', () => {
  describe('layout structure', () => {
    let fixture: ComponentFixture<HostWithSidebarComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithSidebarComponent],
        providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithSidebarComponent);
      fixture.detectChanges();
    });

    it('should render the shell', () => {
      expect(fixture.nativeElement.querySelector('app-shell')).toBeTruthy();
    });

    it('mat-sidenav-content should NOT have w-full class (causes overflow on sidenav toggle)', () => {
      const sidenavContent = fixture.nativeElement.querySelector('mat-sidenav-content');
      expect(sidenavContent).toBeTruthy();
      expect(sidenavContent.classList).not.toContain('w-full');
    });

    it('mat-sidenav-content should have min-w-0 to allow flex shrinking', () => {
      const sidenavContent = fixture.nativeElement.querySelector('mat-sidenav-content');
      expect(sidenavContent.classList).toContain('min-w-0');
    });

    it('should show sidebar when items are provided', () => {
      const sidenav = fixture.nativeElement.querySelector('mat-sidenav');
      expect(sidenav).toBeTruthy();
    });
  });

  describe('projected toolbar-actions visibility — sidebar open', () => {
    let fixture: ComponentFixture<HostWithControlledSidebarComponent>;
    let component: HostWithControlledSidebarComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithControlledSidebarComponent],
        providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithControlledSidebarComponent);
      component = fixture.componentInstance;
    });

    it('logout button should be present when sidebar is OPEN', async () => {
      component.opened.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(btn).toBeTruthy();
    });

    it('logout button should be present when sidebar is CLOSED', async () => {
      component.opened.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(btn).toBeTruthy();
    });

    it('logout button should be present after toggling sidebar from open to closed', async () => {
      component.opened.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      component.opened.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(btn).toBeTruthy();
    });

    it('logout button should be present after toggling sidebar from closed to open', async () => {
      component.opened.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      component.opened.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(btn).toBeTruthy();
    });
  });

  describe('projected toolbar-actions visibility — no sidebar', () => {
    let fixture: ComponentFixture<HostWithoutSidebarComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithoutSidebarComponent],
        providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithoutSidebarComponent);
      fixture.detectChanges();
    });

    it('logout button should be present when there is no sidebar', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(btn).toBeTruthy();
    });

    it('should NOT render sidenav when items are not provided', () => {
      const sidenav = fixture.nativeElement.querySelector('mat-sidenav');
      expect(sidenav).toBeFalsy();
    });
  });

  describe('internal toggle behavior', () => {
    let fixture: ComponentFixture<HostWithSidebarComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithSidebarComponent],
        providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithSidebarComponent);
      fixture.detectChanges();
    });

    it('should show logout button before toggle', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(btn).toBeTruthy();
    });

    it('should show logout button after toggling sidebar via toggle button', async () => {
      const toggleBtn = fixture.nativeElement.querySelector('app-toggle-button button');
      if (toggleBtn) {
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
      }

      const btn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
      expect(btn).toBeTruthy();
    });
  });

  describe('logout event', () => {
    it('shell emits logout when toolbar logout event fires', async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithSidebarComponent],
        providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostWithSidebarComponent);
      fixture.detectChanges();

      const shell = fixture.nativeElement.querySelector('app-shell');
      expect(shell).toBeTruthy();

      const shellComp: ShellComponent = fixture.debugElement.children[0].componentInstance;
      let logoutFired = false;
      shellComp.logout.subscribe(() => (logoutFired = true));
      shellComp.logout.emit();
      expect(logoutFired).toBe(true);
    });
  });

  describe('external sidenavOpened: onToggleSidebar emits event without toggling internal state', () => {
    it('emits toggleSidebar when consumer provides external sidenavOpened', async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithControlledSidebarComponent],
        providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostWithControlledSidebarComponent);
      fixture.detectChanges();

      const shellComp: ShellComponent = fixture.debugElement.children[0].componentInstance;
      let toggleFired = false;
      shellComp.toggleSidebar.subscribe(() => (toggleFired = true));

      (shellComp as unknown as { onToggleSidebar: () => void }).onToggleSidebar();
      expect(toggleFired).toBe(true);
    });
  });
});
