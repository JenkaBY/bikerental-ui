import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DashboardCardComponent } from './dashboard-card.component';

@Component({
  standalone: true,
  imports: [DashboardCardComponent],
  template: `
    <app-dashboard-card
      [title]="title"
      [description]="description"
      [ariaLabel]="aria"
      (activate)="onSelect()"
    ></app-dashboard-card>
  `,
})
class HostComponent {
  title = 'T';
  description = 'D';
  aria = 'a11y';
  selected = false;
  onSelect() {
    this.selected = true;
  }
}

describe('DashboardCardComponent (host)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders title and description and emits select via host binding', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('div')?.textContent).toContain('T');

    const btn = el.querySelector('button') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selected).toBe(true);
  });
});
