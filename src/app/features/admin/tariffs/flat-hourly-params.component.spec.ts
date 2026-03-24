import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { FlatHourlyParamsComponent } from './flat-hourly-params.component';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';

describe('FlatHourlyParamsComponent', () => {
  let fixture: ComponentFixture<FlatHourlyParamsComponent>;
  let component: FlatHourlyParamsComponent;
  let group: FormGroup;

  async function createComponent(ctrls?: Partial<Record<string, FormControl>>) {
    group = new FormGroup({
      hourlyPrice:
        (ctrls && ctrls['hourlyPrice']) ??
        new FormControl<number | null>(null, [Validators.min(0.01)]),
    });

    await TestBed.configureTestingModule({
      imports: [FlatHourlyParamsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FlatHourlyParamsComponent);
    fixture.componentRef.setInput('group', group);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('renders label for hourly price field', async () => {
    await createComponent();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(Labels.HourlyPrice);
  });

  it('shows description when provided', async () => {
    await createComponent();
    fixture.componentRef.setInput('description', 'flat hourly description');
    fixture.detectChanges();
    const descEl = fixture.nativeElement.querySelector('.text-sm');
    expect(descEl).toBeTruthy();
    expect(descEl.textContent).toContain('flat hourly description');
  });

  it('shows required error for hourlyPrice when control has required error', async () => {
    const hourlyPrice = new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
    ]);
    await createComponent({ hourlyPrice });
    hourlyPrice.markAsTouched();
    hourlyPrice.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.required)),
    );
    expect(found).toBe(true);
  });

  it('shows min error for hourlyPrice when value is 0', async () => {
    const hourlyPrice = new FormControl<number | null>(0, [Validators.min(0.01)]);
    await createComponent({ hourlyPrice });
    hourlyPrice.markAsTouched();
    hourlyPrice.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.mustBePositive)),
    );
    expect(found).toBe(true);
  });

  it('shows no errors when value is valid', async () => {
    const hourlyPrice = new FormControl<number | null>(10, [
      Validators.required,
      Validators.min(0.01),
    ]);
    await createComponent({ hourlyPrice });
    hourlyPrice.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBe(0);
  });
});
