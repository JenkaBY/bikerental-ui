import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SpecialPriceInputComponent } from './special-price-input.component';

describe('SpecialPriceInputComponent', () => {
  let fixture: ComponentFixture<SpecialPriceInputComponent>;
  let component: SpecialPriceInputComponent;

  async function setup(value: number | null = null, showRequired = false) {
    await TestBed.configureTestingModule({
      imports: [SpecialPriceInputComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialPriceInputComponent);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('showRequired', showRequired);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should emit the value when a valid positive number is committed', async () => {
    await setup(null);
    const emitted: (number | null)[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set(49.99);
    component['commit']();

    expect(emitted).toEqual([49.99]);
  });

  it('should not emit when committed value is 0 or negative', async () => {
    await setup(null);
    const emitted: (number | null)[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set(0);
    component['commit']();

    expect(emitted).toEqual([]);
  });

  it('should show error when showRequired is true and value is null', async () => {
    await setup(null, true);
    expect(component['showError']()).toBe(true);
  });

  it('should hide error after a valid commit', async () => {
    await setup(null, true);
    component['rawValue'].set(25);
    component['commit']();
    expect(component['showError']()).toBe(false);
  });

  it('should emit null when field is cleared', async () => {
    await setup(10);
    const emitted: (number | null)[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set('');
    component['commit']();

    expect(emitted).toEqual([null]);
  });
});
