import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { DailyParamsComponent } from './daily-params.component';
import { FormErrorMessages, Labels } from '@bikerental/shared';

describe('DailyParamsComponent', () => {
  let fixture: ComponentFixture<DailyParamsComponent>;
  let component: DailyParamsComponent;
  let group: FormGroup;

  async function createComponent(ctrls?: Partial<Record<string, FormControl>>) {
    group = new FormGroup({
      dailyPrice: (ctrls && ctrls['dailyPrice']) ?? new FormControl(null, [Validators.min(0.01)]),
      overtimeHourlyPrice:
        (ctrls && ctrls['overtimeHourlyPrice']) ?? new FormControl(null, [Validators.min(0.01)]),
    });

    await TestBed.configureTestingModule({
      imports: [DailyParamsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyParamsComponent);
    // set the input for the standalone input() API
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

  it('renders labels for daily and overtime fields', async () => {
    await createComponent();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(Labels.DailyPrice);
    expect(text).toContain(Labels.OvertimeHourlyPrice);
  });

  it('shows description when provided', async () => {
    await createComponent();
    fixture.componentRef.setInput('description', 'Some helper text');
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Some helper text');
  });

  it('shows required error for dailyPrice when required and empty', async () => {
    // create a control with Validators.required + min
    const daily = new FormControl(null, [Validators.required, Validators.min(0.01)]);
    await createComponent({ dailyPrice: daily });

    // ensure validators have run and template updated and error is displayed
    daily.updateValueAndValidity();
    daily.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    // first mat-error should correspond to dailyPrice
    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0].textContent)).toContain(FormErrorMessages.required);
  });

  it('shows min error for dailyPrice when value is 0', async () => {
    const daily = new FormControl(0, [Validators.required, Validators.min(0.01)]);
    await createComponent({ dailyPrice: daily });

    // update validity, mark touched and detect changes so mat-error renders
    daily.updateValueAndValidity();
    daily.markAsTouched();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0].textContent)).toContain(FormErrorMessages.mustBePositive);
  });

  it('shows min error for overtimeHourlyPrice when negative', async () => {
    const overtime = new FormControl(-1, [Validators.min(0.01)]);
    await createComponent({ overtimeHourlyPrice: overtime });
    overtime.updateValueAndValidity();
    overtime.markAsTouched();
    fixture.detectChanges();

    // there may be a mat-error for overtime (second field)
    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    // find any mat-error that contains mustBePositive
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.mustBePositive)),
    );
    expect(found).toBe(true);
  });

  it('shows no errors when values are valid', async () => {
    const daily = new FormControl(10, [Validators.required, Validators.min(0.01)]);
    const overtime = new FormControl(5, [Validators.min(0.01)]);
    await createComponent({ dailyPrice: daily, overtimeHourlyPrice: overtime });

    daily.updateValueAndValidity();
    overtime.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBe(0);
  });
});
