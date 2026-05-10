import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DurationInputComponent } from './duration-input.component';

describe('DurationInputComponent', () => {
  let fixture: ComponentFixture<DurationInputComponent>;
  let component: DurationInputComponent;

  async function setup(value = 60) {
    await TestBed.configureTestingModule({
      imports: [DurationInputComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(DurationInputComponent);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should display the initial value in the input', async () => {
    await setup(120);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(Number(input.value)).toBe(120);
  });

  it('should emit the parsed number when a valid value is committed', async () => {
    await setup(60);
    const emitted: number[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set(240);
    component['commit']();

    expect(emitted).toEqual([240]);
  });

  it('should reset rawValue to the current value when an invalid string is committed', async () => {
    await setup(60);
    component['rawValue'].set('abc');
    component['commit']();
    expect(Number(component['rawValue']())).toBe(60);
  });

  it('should not emit when rawValue is not a positive number', async () => {
    await setup(60);
    const emitted: number[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));
    component['rawValue'].set(-10);
    component['commit']();
    expect(emitted).toEqual([]);
  });
});
