import { ThemePreference } from '@/models/types/user.types';

export class ThemeController {
  private currentTheme: ThemePreference = 'light';
  private listeners: Array<(theme: ThemePreference) => void> = [];

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedTheme = this.getSavedTheme();
    if (savedTheme) {
      this.setTheme(savedTheme, false);
      return;
    }

    const prefersDark = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.setTheme(prefersDark ? 'dark' : 'light', false);
  }

  getSavedTheme(): ThemePreference | null {
    if (typeof localStorage === 'undefined') return null;
    const item = localStorage.getItem('eventflow_theme');
    return item === 'light' || item === 'dark' ? item : null;
  }

  getCurrentTheme(): ThemePreference {
    return this.currentTheme;
  }

  setTheme(theme: ThemePreference, persist = true): void {
    this.currentTheme = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem('eventflow_theme', theme);
    }
    this.notifyListeners();
  }

  toggleTheme(): ThemePreference {
    const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme, true);
    return nextTheme;
  }

  subscribe(listener: (theme: ThemePreference) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentTheme);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentTheme);
    }
  }
}

export const themeController = new ThemeController();
