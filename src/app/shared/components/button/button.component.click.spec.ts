import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button
    [title]="title"
    [icon]="icon"
    [showText]="showText"
    (activated)="onActivated()"
  ></app-button>`,
})
class HostButtonTest {
  title = 'T';
  icon = 'star';
  showText = true;
  activated = false;
  onActivated() {
    this.activated = true;
  }
}

describe('ButtonComponent click behavior', () => {
  it('emits activated when text button clicked', async () => {
    await TestBed.configureTestingModule({ imports: [HostButtonTest] }).compileComponents();
    const fixture = TestBed.createComponent(HostButtonTest);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button[mat-button]');
    expect(btn).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activated).toBe(true);
  });

  it('emits activated when icon button clicked', async () => {
    @Component({
      standalone: true,
      imports: [ButtonComponent],
      template: `<app-button
        [title]="title"
        [showText]="false"
        [icon]="icon"
        (activated)="onActivated()"
      ></app-button>`,
    })
    class HostIconTest {
      title = 'I';
      icon = 'star';
      activated = false;
      onActivated() {
        this.activated = true;
      }
    }

    await TestBed.configureTestingModule({ imports: [HostIconTest] }).compileComponents();
    const fixture = TestBed.createComponent(HostIconTest);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button[mat-icon-button]');
    expect(btn).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activated).toBe(true);
  });
});
