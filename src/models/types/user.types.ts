export type ThemePreference = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL?: string | null;
  themePreference?: ThemePreference;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
