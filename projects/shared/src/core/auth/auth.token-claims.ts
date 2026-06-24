export interface AccessTokenClaims {
  roles: string[];
  uid: string | null;
  mustChangePassword: boolean;
}

export function readAccessTokenClaims(payload: unknown): AccessTokenClaims {
  const record = (payload ?? {}) as Record<string, unknown>;
  const rawRoles = record['roles'];
  const roles = Array.isArray(rawRoles)
    ? rawRoles.filter((role): role is string => typeof role === 'string')
    : [];
  const uid = typeof record['uid'] === 'string' ? (record['uid'] as string) : null;
  const mustChangePassword = record['must_change_password'] === true;

  return { roles, uid, mustChangePassword };
}
