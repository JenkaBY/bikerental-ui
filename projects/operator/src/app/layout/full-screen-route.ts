import type { ActivatedRouteSnapshot } from '@angular/router';

export function isFullScreenRoute(root: ActivatedRouteSnapshot): boolean {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.data['fullScreen'] === true;
}
