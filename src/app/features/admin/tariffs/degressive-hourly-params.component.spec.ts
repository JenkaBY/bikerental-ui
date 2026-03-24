import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { DegressiveHourlyParamsComponent } from './degressive-hourly-params.component';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';

describe('DegressiveHourlyParamsComponent', () => {
  let fixture: ComponentFixture<DegressiveHourlyParamsComponent>;
  let component: DegressiveHourlyParamsComponent;
  let group: FormGroup;

  async function createComponent(ctrls?: Partial<Record<string, FormControl>>) {
    group = new FormGroup({
      firstHourPrice:
        (ctrls && ctrls['firstHourPrice']) ?? new FormControl(null, [Validators.min(0.01)]),
      hourlyDiscount:
        (ctrls && ctrls['hourlyDiscount']) ?? new FormControl(null, [Validators.min(0.01)]),
      minimumHourlyPrice:
        (ctrls && ctrls['minimumHourlyPrice']) ?? new FormControl(null, [Validators.min(0.01)]),
      minimumDurationMinutes:
        (ctrls && ctrls['minimumDurationMinutes']) ?? new FormControl(null, [Validators.min(1)]),
      minimumDurationSurcharge:
        (ctrls && ctrls['minimumDurationSurcharge']) ??
        new FormControl(null, [Validators.min(0.01)]),
    });

    await TestBed.configureTestingModule({
      imports: [DegressiveHourlyParamsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DegressiveHourlyParamsComponent);
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

  it('renders labels for all fields', async () => {
    await createComponent();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(Labels.FirstHourPrice);
    expect(text).toContain(Labels.HourlyDiscount);
    expect(text).toContain(Labels.MinimumHourlyPrice);
    expect(text).toContain(Labels.MinimumDurationMinutes);
    expect(text).toContain(Labels.MinimumDurationSurcharge);
  });

  it('shows description when provided', async () => {
    await createComponent();
    fixture.componentRef.setInput('description', 'Helper text');
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Helper text');
  });

  it('shows required errors when controls are required and empty', async () => {
    const required = new FormControl(null, [Validators.required, Validators.min(0.01)]);
    const requiredInt = new FormControl(null, [Validators.required, Validators.min(1)]);
    await createComponent({
      firstHourPrice: required,
      hourlyDiscount: required,
      minimumHourlyPrice: required,
      minimumDurationMinutes: requiredInt,
      minimumDurationSurcharge: required,
    });

    Object.values(group.controls).forEach((c) => {
      c.updateValueAndValidity();
      c.markAsTouched();
    });
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBeGreaterThan(0);
    const foundRequired = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.required)),
    );
    expect(foundRequired).toBe(true);
  });

  it('shows min errors for zero/negative values and min=1 for duration', async () => {
    const first = new FormControl(0, [Validators.required, Validators.min(0.01)]);
    const hourly = new FormControl(0, [Validators.min(0.01)]);
    const minimum = new FormControl(-1, [Validators.min(0.01)]);
    const duration = new FormControl(0, [Validators.min(1)]);
    const surcharge = new FormControl(-1, [Validators.min(0.01)]);

    await createComponent({
      firstHourPrice: first,
      hourlyDiscount: hourly,
      minimumHourlyPrice: minimum,
      minimumDurationMinutes: duration,
      minimumDurationSurcharge: surcharge,
    });

    Object.values(group.controls).forEach((c) => {
      c.updateValueAndValidity();
      c.markAsTouched();
    });
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const foundPositive = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.mustBePositive)),
    );
    expect(foundPositive).toBe(true);

    const foundAtLeastOne = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.mustBeAtLeastOne)),
    );
    expect(foundAtLeastOne).toBe(true);
  });

  it('shows cross-field minimumExceedsFirst error', async () => {
    await createComponent();
    group.setErrors({ minimumExceedsFirst: true });
    group.controls['minimumHourlyPrice'].setErrors({ minimumExceedsFirst: true });
    group.controls['minimumHourlyPrice'].markAsTouched();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.minimumExceedsFirstHour)),
    );
    expect(found).toBe(true);
  });

  it('shows no errors when values are valid', async () => {
    const first = new FormControl(10, [Validators.required, Validators.min(0.01)]);
    const hourly = new FormControl(5, [Validators.min(0.01)]);
    const minimum = new FormControl(5, [Validators.min(0.01)]);
    const duration = new FormControl(10, [Validators.min(1)]);
    const surcharge = new FormControl(1, [Validators.min(0.01)]);

    await createComponent({
      firstHourPrice: first,
      hourlyDiscount: hourly,
      minimumHourlyPrice: minimum,
      minimumDurationMinutes: duration,
      minimumDurationSurcharge: surcharge,
    });

    Object.values(group.controls).forEach((c) => c.updateValueAndValidity());
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBe(0);
  });
});
