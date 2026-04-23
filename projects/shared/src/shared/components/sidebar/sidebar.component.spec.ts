import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { APP_BRAND } from '../../../app.tokens';

@Component({
  standalone: true,
  template: ` <app-sidebar [items]="items" [brand]="brand">
    <div sidebar-footer>Footer</div>
  </app-sidebar>`,
  imports: [SidebarComponent],
})
class HostComponent {
  items = [
    { label: 'A', route: 'a', icon: 'a' },
    { label: 'B', route: 'b', icon: 'b' },
  ];
  brand = 'My Brand';
}

describe('SidebarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, MatListModule, MatIconModule],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: 'Bike Rental Test' }],
    }).compileComponents();
  });

  it('renders brand and items and footer', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('My Brand');
    expect(el.textContent).toContain('A');
    expect(el.textContent).toContain('B');
    expect(el.textContent).toContain('Footer');
  });
});
