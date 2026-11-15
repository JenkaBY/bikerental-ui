export interface AccountRef {
  readonly id: string;
  readonly displayName: string;
}

export interface PlatformManager {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly status: 'ACTIVE' | 'DISABLED';
  readonly mustChangePassword: boolean;
  readonly lastLoginAt?: Date;
  readonly createdAt?: Date;
  readonly createdBy?: AccountRef;
  readonly deactivatedAt?: Date;
  readonly deactivatedBy?: AccountRef;
}

export interface PlatformManagerCreateWrite {
  username: string;
  email: string;
  displayName?: string;
  password?: string;
}

export interface PlatformManagerCreationResult {
  readonly manager: PlatformManager;
  readonly temporaryPassword: string;
}
