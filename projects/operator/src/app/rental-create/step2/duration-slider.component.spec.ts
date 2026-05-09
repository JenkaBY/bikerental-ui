import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DurationSliderComponent } from './duration-slider.component';

const SNAP_POINTS = [30, 60, 120, 240, 480, 1440, 2880] as const;

describe('DurationSliderComponent', () => {
  let fixture: ComponentFixture<DurationSliderComponent>;
  let component: DurationSliderComponent;

  async function setup(value: number) {
    await TestBed.configureTestingModule({
      imports: [DurationSliderComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(DurationSliderComponent);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('snapPoints', SNAP_POINTS);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should map value=60 to sliderIndex=1', async () => {
    await setup(60);
    expect(component['sliderIndex']()).toBe(1);
  });

  it('should map value=120 to sliderIndex=2', async () => {
    await setup(120);
    expect(component['sliderIndex']()).toBe(2);
  });

  it('should map an in-between value to the nearest snap index', async () => {
    await setup(90); // between 60 (idx 1) and 120 (idx 2) — 90 is equidistant; either is acceptable
    const idx = component['sliderIndex']();
    expect([1, 2]).toContain(idx);
  });

  it('should emit the snap-point value when onSliderChange is called', async () => {
    await setup(60);
    const emitted: number[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));
    component['onSliderChange'](2); // index 2 → 120 min
    expect(emitted).toEqual([120]);
  });

  it('should not emit for an out-of-range index', async () => {
    await setup(60);
    const emitted: number[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));
    component['onSliderChange'](99);
    expect(emitted).toEqual([]);
  });
});
