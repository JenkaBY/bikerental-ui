import type { UserProfile } from '@ui-models';

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export class UserProfileMapper {
  static fromResponse(r: UserProfileResponse): UserProfile {
    return {
      id: r.id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      roles: r.roles,
      isAdmin: r.roles.includes('ADMIN'),
      isOperator: r.roles.includes('OPERATOR'),
    };
  }
}
