import { describe, it, expect } from 'vitest';
import { AuthGuard } from '@/routes/guards';

describe('AuthGuard', () => {
  it('deve bloquear usuário não autenticado ao tentar acessar rota protegida e redirecionar para /login', () => {
    const route = { path: '/app', isProtected: true };
    const access = AuthGuard.canAccess(route, false);

    expect(access.allowed).toBe(false);
    expect(access.redirectTo).toBe('/login');
  });

  it('deve permitir usuário autenticado acessar rota protegida', () => {
    const route = { path: '/app', isProtected: true };
    const access = AuthGuard.canAccess(route, true);

    expect(access.allowed).toBe(true);
    expect(access.redirectTo).toBeUndefined();
  });

  it('deve redirecionar usuário autenticado para /app ao acessar rota pública de autenticação', () => {
    const route = { path: '/login', isProtected: false, redirectToIfAuthenticated: '/app' };
    const access = AuthGuard.canAccess(route, true);

    expect(access.allowed).toBe(false);
    expect(access.redirectTo).toBe('/app');
  });

  it('deve permitir usuário anônimo acessar rota pública de login', () => {
    const route = { path: '/login', isProtected: false, redirectToIfAuthenticated: '/app' };
    const access = AuthGuard.canAccess(route, false);

    expect(access.allowed).toBe(true);
    expect(access.redirectTo).toBeUndefined();
  });
});
