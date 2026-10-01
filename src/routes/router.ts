import { AuthGuard, RouteConfig } from './guards';

export type RouteParams = Record<string, string>;
export type RouteHandler = (params?: RouteParams) => HTMLElement | Promise<HTMLElement>;

export interface RouteEntry extends RouteConfig {
  handler: RouteHandler;
}

interface MatchResult {
  route: RouteEntry;
  params: RouteParams;
}

export class Router {
  private routes: Map<string, RouteEntry> = new Map();
  private container: HTMLElement | null = null;
  private currentPath = '';
  private currentParams: RouteParams = {};
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
    if (pushState && typeof window !== 'undefined' && window.history?.pushState) {
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

  getParams(): RouteParams {
    return this.currentParams;
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

  private matchRoute(path: string): MatchResult | null {
    // 1. Match exato
    if (this.routes.has(path)) {
      return {
        route: this.routes.get(path)!,
        params: {}
      };
    }

    // 2. Match parametrizado (ex: /events/:id)
    for (const [pattern, route] of this.routes.entries()) {
      if (!pattern.includes(':')) continue;

      const paramNames: string[] = [];
      const regexPattern = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });

      const regex = new RegExp(`^${regexPattern}$`);
      const match = path.match(regex);

      if (match) {
        const params: RouteParams = {};
        paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { route, params };
      }
    }

    return null;
  }

  async resolveCurrentRoute(): Promise<void> {
    if (!this.container) return;

    let path = this.currentPath;
    if (!path || path === '/') {
      path = this.isAuthenticated
        ? (this.routes.has('/events') ? '/events' : '/app')
        : '/login';
    }

    const matched = this.matchRoute(path);

    if (!matched) {
      const fallback = this.isAuthenticated
        ? (this.routes.has('/events') ? '/events' : '/app')
        : '/login';

      if (fallback !== path && this.routes.has(fallback)) {
        this.navigate(fallback, false);
      }
      return;
    }

    const { route, params } = matched;
    this.currentParams = params;

    const access = AuthGuard.canAccess(route, this.isAuthenticated);
    if (!access.allowed && access.redirectTo) {
      this.navigate(access.redirectTo, false);
      return;
    }

    try {
      const element = await route.handler(params);
      this.container.innerHTML = '';
      this.container.appendChild(element);
    } catch (err) {
      console.error('Erro ao renderizar rota:', err);
    }
  }
}

export const router = new Router();
