export type ThemePreference = 'light' | 'dark' | 'system';
export type UserRole = 'admin' | 'manager' | 'operator';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  themePreference: ThemePreference;
  role: UserRole;
  status: UserStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
