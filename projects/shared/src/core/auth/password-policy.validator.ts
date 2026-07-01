import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const LETTER = /[A-Za-z]/;
const DIGIT = /\d/;
const MIN_LENGTH = 8;
const MAX_LENGTH = 20;

export const passwordPolicyValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const errors: ValidationErrors = {};
  if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
    errors['passwordLength'] = true;
  }
  if (!LETTER.test(value) || !DIGIT.test(value)) {
    errors['passwordComposition'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export function passwordsMatchValidator(
  newControlName: string,
  confirmControlName: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const confirmCtrl = group.get(confirmControlName);
    const newValue = group.get(newControlName)?.value;
    const confirmValue = confirmCtrl?.value;
    const hasMismatch = Boolean(confirmValue) && newValue !== confirmValue;

    if (hasMismatch) {
      confirmCtrl?.setErrors(
        { ...(confirmCtrl.errors ?? {}), passwordsMismatch: true },
        { emitEvent: false },
      );
      return { passwordsMismatch: true };
    }

    if (confirmCtrl?.hasError('passwordsMismatch')) {
      const remaining = { ...confirmCtrl.errors };
      delete remaining['passwordsMismatch'];
      confirmCtrl?.setErrors(Object.keys(remaining).length ? remaining : null, {
        emitEvent: false,
      });
    }

    return null;
  };
}
