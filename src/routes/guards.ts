export interface RouteConfig {
  path: string;
  isProtected?: boolean;
  redirectToIfAuthenticated?: string;
}

export class AuthGuard {
  static canAccess(
    route: RouteConfig,
    isAuthenticated: boolean
  ): { allowed: boolean; redirectTo?: string } {
    // Se a rota for protegida e o usuário NÃO estiver autenticado -> vai para /login
    if (route.isProtected && !isAuthenticated) {
      return { allowed: false, redirectTo: '/login' };
    }

    // Se for rota pública (ex: login/register) e o usuário já estiver autenticado -> vai para /app
    if (!route.isProtected && isAuthenticated && route.redirectToIfAuthenticated) {
      return { allowed: false, redirectTo: route.redirectToIfAuthenticated };
    }

    return { allowed: true };
  }
}
