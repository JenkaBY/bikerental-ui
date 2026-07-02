import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserCreationResponse,
  UserResponse,
} from '@api-models';
import type {
  ManagedUser,
  ManagedUserCreateWrite,
  ManagedUserUpdateWrite,
  UserCreationResult,
} from '../models/managed-user.model';
import type { Role } from '../models/role.model';

export class ManagedUserMapper {
  static fromResponse(r: UserResponse): ManagedUser {
    return {
      id: r.id ?? '',
      username: r.username ?? '',
      email: r.email ?? '',
      displayName: r.displayName ?? '',
      status: r.status ?? 'ACTIVE',
      mustChangePassword: r.mustChangePassword ?? false,
      roles: (r.roles ?? []) as Role[],
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt) : undefined,
    };
  }

  static toCreateRequest(w: ManagedUserCreateWrite): CreateUserRequest {
    return {
      username: w.username,
      email: w.email,
      displayName: w.displayName || undefined,
      roles: w.roles,
      password: w.password || undefined,
    };
  }

  static toUpdateRequest(w: ManagedUserUpdateWrite): UpdateUserRequest {
    return {
      displayName: w.displayName,
      roles: w.roles,
      status: w.status,
    };
  }

  static fromCreationResponse(r: UserCreationResponse): UserCreationResult {
    return {
      user: ManagedUserMapper.fromResponse(r.user ?? {}),
      temporaryPassword: r.temporaryPassword ?? '',
    };
  }
}
