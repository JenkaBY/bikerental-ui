import { inject, Injectable } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Customer, CustomerWrite } from '../../../core/models';
import { PhoneValidators } from '../../validators/phone-validators';
import { pastDateValidator } from '../../validators/date-validators';

@Injectable()
export class CustomerFormProvider {
  private readonly fb = inject(NonNullableFormBuilder);

  public readonly form = new FormGroup({
    phone: new FormControl('', {
      nonNullable: true,
      validators: PhoneValidators,
    }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    birthDate: new FormControl<Date | null>(null, [pastDateValidator()]),
    notes: new FormControl('', { nonNullable: true }),
  });

  patchValue(customer: Partial<Customer>): void {
    this.form.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      birthDate: customer.birthDate,
      notes: customer.notes,
    });
  }

  getRawValue() {
    return this.form.getRawValue();
  }

  getCustomerWrite(): CustomerWrite {
    const { phone, firstName, lastName, email, birthDate, notes } = this.form.getRawValue();
    return {
      phone,
      firstName,
      lastName,
      email: email || undefined,
      birthDate: birthDate || undefined,
      notes: notes || undefined,
    };
  }

  get isValid(): boolean {
    return this.form.valid;
  }
}
