import type {
  AccountRefResponse,
  CreatePlatformManagerRequest,
  PlatformManagerCreationResponse,
  PlatformManagerResponse,
} from '@api-models';
import type {
  AccountRef,
  PlatformManager,
  PlatformManagerCreateWrite,
  PlatformManagerCreationResult,
} from '../models/platform-manager.model';

export class PlatformManagerMapper {
  static fromResponse(r: PlatformManagerResponse): PlatformManager {
    return {
      id: r.id ?? '',
      username: r.username ?? '',
      email: r.email ?? '',
      displayName: r.displayName ?? '',
      status: r.status ?? 'ACTIVE',
      mustChangePassword: r.mustChangePassword ?? false,
      lastLoginAt: PlatformManagerMapper.toDate(r.lastLoginAt),
      createdAt: PlatformManagerMapper.toDate(r.createdAt),
      createdBy: PlatformManagerMapper.toRef(r.createdBy),
      deactivatedAt: PlatformManagerMapper.toDate(r.deactivatedAt),
      deactivatedBy: PlatformManagerMapper.toRef(r.deactivatedBy),
    };
  }

  static toCreateRequest(w: PlatformManagerCreateWrite): CreatePlatformManagerRequest {
    return {
      username: w.username,
      email: w.email,
      displayName: w.displayName || undefined,
      password: w.password || undefined,
    };
  }

  static fromCreationResponse(r: PlatformManagerCreationResponse): PlatformManagerCreationResult {
    return {
      manager: PlatformManagerMapper.fromResponse(r.user ?? {}),
      temporaryPassword: r.temporaryPassword ?? '',
    };
  }

  private static toDate(value?: string): Date | undefined {
    return value ? new Date(value) : undefined;
  }

  private static toRef(r?: AccountRefResponse | null): AccountRef | undefined {
    return r ? { id: r.id ?? '', displayName: r.displayName ?? '' } : undefined;
  }
}
