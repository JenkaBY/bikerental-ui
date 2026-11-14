import {
  ChangeDetectorRef,
  DestroyRef,
  Directive,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Labels } from '../../constant/labels';
import { FormErrorMessages } from '../../validators/form-error-messages';

@Directive()
export abstract class GeoControlBase<T, P = T> implements ControlValueAccessor, OnInit {
  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;

  readonly picked = output<P>();

  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly value = signal<T | null>(null);
  protected readonly disabled = signal(false);
  protected readonly matcher: ErrorStateMatcher = { isErrorState: () => this.invalid() };

  private onChange: (value: T | null) => void = () => void 0;
  protected onTouched: () => void = () => void 0;

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    this.ngControl?.control?.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  writeValue(value: T | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected commit(value: T | null): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected hasError(code: string): boolean {
    return !!this.ngControl?.hasError(code);
  }

  protected serverError(): string | null {
    return this.ngControl?.getError('server') ?? null;
  }

  private invalid(): boolean {
    return !!this.ngControl?.invalid && !!this.ngControl.touched;
  }
}
