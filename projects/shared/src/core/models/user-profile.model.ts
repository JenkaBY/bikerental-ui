export type UserAccountStatus = 'ACTIVE' | 'DISABLED';

export interface UserClient {
  slug: string;
  displayName: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  roles: string[];
  isAdmin: boolean;
  isOperator: boolean;
  mustChangePassword: boolean;
  status: UserAccountStatus;
  client: UserClient | null;
}
