import type { UserAccountStatus, UserProfile } from '@ui-models';
import type { UserResponse } from '../api/generated';

export class UserProfileMapper {
  static fromResponse(r: UserResponse): UserProfile {
    const roles = r.roles ?? [];
    return {
      id: r.id ?? '',
      username: r.username ?? '',
      email: r.email ?? '',
      displayName: r.displayName ?? r.username ?? '',
      roles,
      isAdmin: roles.includes('ADMIN'),
      isOperator: roles.includes('OPERATOR'),
      mustChangePassword: r.mustChangePassword ?? false,
      status: (r.status ?? 'ACTIVE') as UserAccountStatus,
    };
  }
}
