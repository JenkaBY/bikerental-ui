import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CancelButtonComponent } from './cancel-button.component';

@Component({
  standalone: true,
  imports: [CancelButtonComponent],
  template: `<app-form-cancel-button></app-form-cancel-button>`,
})
class Host {}

describe('CancelButtonComponent', () => {
  it('renders cancel button with localized text', async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Cancel');
  });
});
