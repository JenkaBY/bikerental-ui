import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button [title]="title" [icon]="icon" [showText]="showText"></app-button>`,
})
class HostTextComponent {
  title = 'Hello';
  icon = 'star';
  showText = true;
}

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button [title]="title" [showText]="showText" [icon]="icon"></app-button>`,
})
class HostIconFallbackComponent {
  title = 'X';
  showText = false;
  icon: string | undefined = undefined;
}

describe('ButtonComponent', () => {
  it('renders text button with icon when showText and icon provided', async () => {
    await TestBed.configureTestingModule({ imports: [HostTextComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostTextComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button[mat-button]')).toBeTruthy();
    expect(el.textContent).toContain('Hello');
    expect(el.querySelector('mat-icon')).toBeTruthy();
  });

  it('renders icon-button when showText is false and no icon -> fallback icon', async () => {
    await TestBed.configureTestingModule({
      imports: [HostIconFallbackComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostIconFallbackComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button[mat-icon-button]')).toBeTruthy();
    expect(el.querySelector('mat-icon')?.textContent?.trim()).toBe('help');
  });
});
