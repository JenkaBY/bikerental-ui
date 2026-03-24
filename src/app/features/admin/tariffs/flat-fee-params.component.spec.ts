import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { FlatFeeParamsComponent } from './flat-fee-params.component';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';

describe('FlatFeeParamsComponent', () => {
  let fixture: ComponentFixture<FlatFeeParamsComponent>;
  let component: FlatFeeParamsComponent;
  let group: FormGroup;

  async function createComponent(ctrls?: Partial<Record<string, FormControl>>) {
    group = new FormGroup({
      issuanceFee:
        (ctrls && ctrls['issuanceFee']) ??
        new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
      minimumDurationMinutes:
        (ctrls && ctrls['minimumDurationMinutes']) ??
        new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      minimumDurationSurcharge:
        (ctrls && ctrls['minimumDurationSurcharge']) ??
        new FormControl<number | null>(null, [Validators.min(0.01)]),
    });

    await TestBed.configureTestingModule({
      imports: [FlatFeeParamsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FlatFeeParamsComponent);
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

  it('renders provided description', async () => {
    await createComponent();
    fixture.componentRef.setInput('description', 'test description');
    fixture.detectChanges();
    const descEl = fixture.nativeElement.querySelector('.text-sm');
    expect(descEl).toBeTruthy();
    expect(descEl.textContent).toContain('test description');
  });

  it('shows required error for issuanceFee when control has required error', async () => {
    const issuanceFee = new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]);
    await createComponent({ issuanceFee });
    issuanceFee.markAsTouched();
    issuanceFee.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.required)),
    );
    expect(found).toBe(true);
  });

  it('shows min error for minimumDurationMinutes when below min', async () => {
    const minimumDurationMinutes = new FormControl<number | null>(0, [
      Validators.required,
      Validators.min(1),
    ]);
    await createComponent({ minimumDurationMinutes });
    minimumDurationMinutes.markAsTouched();
    minimumDurationMinutes.updateValueAndValidity();
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    const found = (Array.from(errors) as Element[]).some((e: Element) =>
      Boolean(e.textContent && e.textContent.includes(FormErrorMessages.mustBeAtLeastOne)),
    );
    expect(found).toBe(true);
  });
});
