export type Role = 'ADMIN' | 'OPERATOR';

export const ASSIGNABLE_ROLES: readonly Role[] = ['ADMIN', 'OPERATOR'];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: $localize`Admin`,
  OPERATOR: $localize`Operator`,
};
