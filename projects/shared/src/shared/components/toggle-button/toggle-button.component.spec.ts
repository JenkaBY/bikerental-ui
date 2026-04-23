import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ToggleButtonComponent } from './toggle-button.component';

@Component({
  standalone: true,
  imports: [ToggleButtonComponent],
  template: `<app-toggle-button [pressed]="pressed" [customIcon]="customIcon"></app-toggle-button>`,
})
class HostToggleComponent {
  pressed = false;
  customIcon: string | undefined = undefined;
}

describe('ToggleButtonComponent', () => {
  it('default: not pressed and no custom -> menu', async () => {
    await TestBed.configureTestingModule({ imports: [HostToggleComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostToggleComponent);
    fixture.detectChanges();
    const instance = fixture.debugElement.children[0].componentInstance as ToggleButtonComponent;
    expect(instance.icon()).toBe('menu');
  });

  it('pressed true -> menu_open', async () => {
    @Component({
      standalone: true,
      imports: [ToggleButtonComponent],
      template: `<app-toggle-button [pressed]="true"></app-toggle-button>`,
    })
    class HostPressed {}

    await TestBed.configureTestingModule({ imports: [HostPressed] }).compileComponents();
    const fixture = TestBed.createComponent(HostPressed);
    fixture.detectChanges();
    const instance = fixture.debugElement.children[0].componentInstance as ToggleButtonComponent;
    expect(instance.icon()).toBe('menu_open');
  });

  it('customIcon overrides', async () => {
    @Component({
      standalone: true,
      imports: [ToggleButtonComponent],
      template: `<app-toggle-button [customIcon]="'abc'"></app-toggle-button>`,
    })
    class HostCustom {}

    await TestBed.configureTestingModule({ imports: [HostCustom] }).compileComponents();
    const fixture = TestBed.createComponent(HostCustom);
    fixture.detectChanges();
    const instance = fixture.debugElement.children[0].componentInstance as ToggleButtonComponent;
    expect(instance.icon()).toBe('abc');
  });
});
