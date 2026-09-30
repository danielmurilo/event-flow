import { AuthGuard, RouteConfig } from './guards';

export type RouteHandler = () => HTMLElement | Promise<HTMLElement>;

export interface RouteEntry extends RouteConfig {
  handler: RouteHandler;
}

export class Router {
  private routes: Map<string, RouteEntry> = new Map();
  private container: HTMLElement | null = null;
  private currentPath = '';
  private isAuthenticated = false;

  constructor(containerElement?: HTMLElement) {
    if (containerElement) {
      this.container = containerElement;
    }
  }

  setContainer(containerElement: HTMLElement): void {
    this.container = containerElement;
  }

  setAuthState(isAuthenticated: boolean): void {
    this.isAuthenticated = isAuthenticated;
    this.resolveCurrentRoute();
  }

  register(route: RouteEntry): void {
    this.routes.set(route.path, route);
  }

  navigate(path: string, pushState = true): void {
    if (pushState && typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    this.currentPath = path;
    this.resolveCurrentRoute();
  }

  getCurrentPath(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/login';
    }
    return this.currentPath || '/login';
  }

  init(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.currentPath = window.location.pathname;
        this.resolveCurrentRoute();
      });
      this.currentPath = window.location.pathname;
      this.resolveCurrentRoute();
    }
  }

  async resolveCurrentRoute(): Promise<void> {
    if (!this.container) return;

    let path = this.currentPath;
    if (!path || path === '/') {
      path = this.isAuthenticated ? '/app' : '/login';
    }

    const route = this.routes.get(path);
    if (!route) {
      // Redireciona para /app ou /login se rota não existir
      this.navigate(this.isAuthenticated ? '/app' : '/login', true);
      return;
    }

    const access = AuthGuard.canAccess(route, this.isAuthenticated);
    if (!access.allowed && access.redirectTo) {
      this.navigate(access.redirectTo, true);
      return;
    }

    try {
      const element = await route.handler();
      this.container.innerHTML = '';
      this.container.appendChild(element);
    } catch (err) {
      console.error('Erro ao renderizar rota:', err);
    }
  }
}

export const router = new Router();
