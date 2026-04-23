import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SidebarNavItemComponent } from './sidebar-nav-item.component';
import { NavItem } from './nav-item.model';

@Component({
  standalone: true,
  template: ` <app-sidebar-nav-item [item]="item"></app-sidebar-nav-item>`,
  imports: [SidebarNavItemComponent],
})
class HostComponent {
  item: NavItem = { label: 'Test Label', route: 'test-route', icon: 'test_icon' };
}

describe('SidebarNavItemComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, MatListModule, MatIconModule],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render icon and label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('mat-icon');
    const label = compiled.querySelector('span');

    expect(icon).toBeTruthy();
    expect(icon?.textContent?.trim()).toBe('test_icon');
    expect(label?.textContent?.trim()).toBe('Test Label');
  });
});
