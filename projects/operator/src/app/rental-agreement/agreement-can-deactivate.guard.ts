import type { CanDeactivateFn } from '@angular/router';
import type { Observable } from 'rxjs';
import type { RentalAgreementComponent } from './rental-agreement.component';

export const agreementCanDeactivate: CanDeactivateFn<RentalAgreementComponent> = (
  component,
): Observable<boolean> => component.confirmLeave();
