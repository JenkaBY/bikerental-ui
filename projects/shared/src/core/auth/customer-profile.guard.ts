import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStore } from '../state/user.store';

export const customerProfileGuard: CanActivateFn = () => {
  const userStore = inject(UserStore);
  const router = inject(Router);
  const user = userStore.currentUser();
  if (user?.isOperator || user?.isAdmin) {
    return true;
  }
  return router.parseUrl('/');
};
