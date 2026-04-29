import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function pastDateValidator(options?: { allowToday?: boolean }): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) return null;
    const inputDate = new Date(value);

    if (isNaN(inputDate.getTime())) {
      return { invalidDate: true };
    }

    const today = new Date();

    if (options?.allowToday) {
      today.setHours(23, 59, 59, 999);
    } else {
      today.setHours(0, 0, 0, 0);
    }

    const isPast = options?.allowToday ? inputDate <= today : inputDate < today;

    return isPast ? null : { notInPast: true };
  };
}
