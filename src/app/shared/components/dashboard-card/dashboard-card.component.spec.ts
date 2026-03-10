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
      [disabled]="disabled"
      (activate)="onSelect()"
    ></app-dashboard-card>
  `,
})
class HostComponent {
  title = 'T';
  description = 'D';
  aria = 'a11y';
  disabled = false;
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

  it('does not emit activate when disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selected).toBe(false);
  });

  it('renders with default empty inputs when not provided', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCardComponent],
    }).compileComponents();

    const fix = TestBed.createComponent(DashboardCardComponent);
    fix.detectChanges();
    expect(fix.componentInstance).toBeTruthy();
  });
});
