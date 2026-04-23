import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SaveButtonComponent } from './save-button.component';

@Component({
  standalone: true,
  imports: [SaveButtonComponent],
  template: `<app-form-save-button
    [saving]="saving"
    [disabled]="disabled"
    (save)="onSave()"
  ></app-form-save-button>`,
})
class HostComponent {
  saving = false;
  disabled = false;
  saved = false;
  onSave() {
    this.saved = true;
  }
}

describe('SaveButtonComponent', () => {
  it('shows "Save" and is enabled by default', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('Save');
  });

  it('shows "Saving..." and is disabled when saving is true', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.saving = true;
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.textContent).toContain('Saving...');
    expect(btn.disabled).toBe(true);
  });

  it('is disabled when disabled input is true', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('emits save event when clicked', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(fixture.componentInstance.saved).toBe(true);
  });
});
