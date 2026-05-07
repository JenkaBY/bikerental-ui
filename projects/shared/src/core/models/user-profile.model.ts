export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isAdmin: boolean;
  isOperator: boolean;
}
