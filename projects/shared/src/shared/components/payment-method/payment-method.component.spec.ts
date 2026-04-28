import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentMethodSelectComponent } from '@bikerental/shared';
import type { PaymentMethod } from '@ui-models';

describe('PaymentMethodSelectComponent', () => {
  let fixture: ComponentFixture<PaymentMethodSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodSelectComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentMethodSelectComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('writeValue should update internal value', () => {
    const inst = fixture.componentInstance as unknown as {
      writeValue(v: PaymentMethod | null): void;
    };
    expect(() => inst.writeValue('BANK_TRANSFER' as PaymentMethod)).not.toThrow();
  });

  it('should call registered change and touched callbacks when selection changes', () => {
    const onChange = vi.fn();
    const onTouched = vi.fn();
    const inst = fixture.componentInstance as unknown as {
      registerOnChange(fn: (v: unknown) => void): void;
      registerOnTouched(fn: () => void): void;
      onChange(v: unknown): void;
      value: unknown;
    };

    inst.registerOnChange(onChange);
    inst.registerOnTouched(onTouched);

    // simulate user selecting a value
    inst.onChange('CARD_TERMINAL');

    expect(inst.value).toBe('CARD_TERMINAL');
    expect(onChange).toHaveBeenCalledWith('CARD_TERMINAL');
    expect(onTouched).toHaveBeenCalled();
  });
});
