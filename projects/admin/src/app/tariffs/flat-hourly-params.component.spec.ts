import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { FlatHourlyParamsComponent } from './flat-hourly-params.component';
import { FormErrorMessages, Labels } from '@bikerental/shared';

describe('FlatHourlyParamsComponent', () => {
  let fixture: ComponentFixture<FlatHourlyParamsComponent>;
  let component: FlatHourlyParamsComponent;
  let group: FormGroup;

  async function createComponent(ctrls?: Partial<Record<string, FormControl>>) {
    group = new FormGroup({
      hourlyPrice:
        (ctrls && ctrls['hourlyPrice']) ??
        new FormControl<number | null>(null, [Validators.min(0.01)]),
      minimumDurationMinutes:
        (ctrls && ctrls['minimumDurationMinutes']) ??
        new FormControl<number | null>(null, [Validators.min(1)]),
      minimumDurationSurcharge:
        (ctrls && ctrls['minimumDurationSurcharge']) ??
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

  it('renders label for minimum duration minutes field', async () => {
    await createComponent();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(Labels.MinimumDurationMinutes);
  });

  it('renders label for minimum duration surcharge field', async () => {
    await createComponent();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(Labels.MinimumDurationSurcharge);
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

  it('shows required error for minimumDurationMinutes when control has required error', async () => {
    const minimumDurationMinutes = new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]);
    await createComponent({ minimumDurationMinutes });
    minimumDurationMinutes.markAsTouched();
    minimumDurationMinutes.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.required)),
    );
    expect(found).toBe(true);
  });

  it('shows required error for minimumDurationSurcharge when control has required error', async () => {
    const minimumDurationSurcharge = new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
    ]);
    await createComponent({ minimumDurationSurcharge });
    minimumDurationSurcharge.markAsTouched();
    minimumDurationSurcharge.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.required)),
    );
    expect(found).toBe(true);
  });

  it('shows no errors when value is valid', async () => {
    const hourlyPrice = new FormControl<number | null>(10, [
      Validators.required,
      Validators.min(0.01),
    ]);
    const minimumDurationMinutes = new FormControl<number | null>(30, [
      Validators.required,
      Validators.min(1),
    ]);
    const minimumDurationSurcharge = new FormControl<number | null>(5, [
      Validators.required,
      Validators.min(0.01),
    ]);
    await createComponent({ hourlyPrice, minimumDurationMinutes, minimumDurationSurcharge });
    hourlyPrice.updateValueAndValidity();
    minimumDurationMinutes.updateValueAndValidity();
    minimumDurationSurcharge.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBe(0);
  });
});
