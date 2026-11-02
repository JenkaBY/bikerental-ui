import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FinanceReceiptStore } from '@bikerental/shared';

export const financeReceiptGuard: CanActivateFn = () =>
  inject(FinanceReceiptStore).has() || inject(Router).createUrlTree(['/cash']);
