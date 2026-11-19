import type { UserAccountStatus, UserClient, UserProfile } from '@ui-models';
import type { UserClientResponse, UserProfileResponse } from '../api/generated';

export class UserProfileMapper {
  static fromResponse(r: UserProfileResponse): UserProfile {
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
      client: UserProfileMapper.clientFrom(r.client),
    };
  }

  private static clientFrom(c: UserClientResponse | null | undefined): UserClient | null {
    if (!c?.slug) {
      return null;
    }
    return { slug: c.slug, displayName: c.displayName ?? c.slug };
  }
}
