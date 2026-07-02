import type { Role } from './role.model';

export interface ManagedUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly status: 'ACTIVE' | 'DISABLED';
  readonly mustChangePassword: boolean;
  readonly roles: Role[];
  readonly lastLoginAt?: Date;
}

export interface ManagedUserCreateWrite {
  username: string;
  email: string;
  displayName?: string;
  roles: Role[];
  password?: string;
}

export interface ManagedUserUpdateWrite {
  displayName?: string;
  roles?: Role[];
  status?: 'ACTIVE' | 'DISABLED';
}

export interface UserCreationResult {
  readonly user: ManagedUser;
  readonly temporaryPassword: string;
}
