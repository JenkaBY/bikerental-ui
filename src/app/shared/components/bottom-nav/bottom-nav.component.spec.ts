import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BottomNavComponent } from './bottom-nav.component';
import { NavItem } from '../sidebar-nav-item/nav-item.model';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: 'dashboard', icon: 'dashboard' },
  { label: 'New Rental', route: 'rental/new', icon: 'add_circle' },
  { label: 'Return', route: 'return', icon: 'qr_code_scanner' },
];

@Component({
  standalone: true,
  imports: [BottomNavComponent],
  template: `<app-bottom-nav [items]="items" />`,
})
class HostComponent {
  items: NavItem[] = NAV_ITEMS;
}

describe('BottomNavComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should render', () => {
    expect(fixture.nativeElement.querySelector('app-bottom-nav')).toBeTruthy();
  });

  it('should render a nav element', () => {
    expect(fixture.nativeElement.querySelector('nav')).toBeTruthy();
  });

  it('should render one anchor per nav item', () => {
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(NAV_ITEMS.length);
  });

  it('should display the label of each nav item', () => {
    const text = fixture.nativeElement.textContent as string;
    for (const item of NAV_ITEMS) {
      expect(text).toContain(item.label);
    }
  });

  it('should render mat-icon for each nav item', () => {
    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    expect(icons.length).toBe(NAV_ITEMS.length);
  });

  it('each anchor should carry the bottom-nav-item class', () => {
    const links = fixture.nativeElement.querySelectorAll('a');
    links.forEach((link: Element) => {
      expect(link.classList).toContain('bottom-nav-item');
    });
  });
});
