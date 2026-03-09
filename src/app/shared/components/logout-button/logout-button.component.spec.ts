import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LogoutButtonComponent } from './logout-button.component';

@Component({
  standalone: true,
  imports: [LogoutButtonComponent],
  template: `<app-logout-button (logout)="onLogout()"></app-logout-button>`,
})
class HostComp {
  called = false;
  onLogout() {
    this.called = true;
  }
}

describe('LogoutButtonComponent', () => {
  it('emits logout when activated', async () => {
    await TestBed.configureTestingModule({ imports: [HostComp] }).compileComponents();
    const fixture = TestBed.createComponent(HostComp);
    fixture.detectChanges();
    // Simulate inner button activation by dispatching activated event
    const btn = fixture.nativeElement.querySelector('app-button');
    // The ButtonComponent uses (activated) which triggers logout; dispatch CustomEvent
    btn.dispatchEvent(new CustomEvent('activated'));
    fixture.detectChanges();
    expect(fixture.componentInstance.called).toBe(true);
  });
});
