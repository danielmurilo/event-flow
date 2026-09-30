import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '@/routes/router';

describe('Router', () => {
  let router: Router;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    router = new Router(container);
  });

  it('deve registrar e renderizar rota pública quando usuário não estiver autenticado', async () => {
    const handler = vi.fn(() => {
      const el = document.createElement('div');
      el.id = 'login-view';
      el.textContent = 'Login View';
      return el;
    });

    router.register({
      path: '/login',
      isProtected: false,
      handler
    });

    router.navigate('/login', false);
    await router.resolveCurrentRoute();

    expect(handler).toHaveBeenCalled();
    expect(container.querySelector('#login-view')?.textContent).toBe('Login View');
  });

  it('deve redirecionar para /login ao tentar acessar rota protegida sem autenticação', async () => {
    const loginHandler = vi.fn(() => {
      const el = document.createElement('div');
      el.id = 'login-view';
      return el;
    });

    const appHandler = vi.fn(() => {
      const el = document.createElement('div');
      el.id = 'app-view';
      return el;
    });

    router.register({
      path: '/login',
      isProtected: false,
      handler: loginHandler
    });

    router.register({
      path: '/app',
      isProtected: true,
      handler: appHandler
    });

    router.setAuthState(false);
    router.navigate('/app', false);
    await router.resolveCurrentRoute();

    expect(appHandler).not.toHaveBeenCalled();
    expect(loginHandler).toHaveBeenCalled();
    expect(container.querySelector('#login-view')).not.toBeNull();
  });

  it('deve permitir acesso à rota protegida quando autenticado', async () => {
    const appHandler = vi.fn(() => {
      const el = document.createElement('div');
      el.id = 'app-view';
      el.textContent = 'Dashboard Protegido';
      return el;
    });

    router.register({
      path: '/app',
      isProtected: true,
      handler: appHandler
    });

    router.setAuthState(true);
    router.navigate('/app', false);
    await router.resolveCurrentRoute();

    expect(appHandler).toHaveBeenCalled();
    expect(container.querySelector('#app-view')?.textContent).toBe('Dashboard Protegido');
  });
});
