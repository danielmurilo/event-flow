import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLoginPage } from '@/views/pages/LoginPage';
import { createRegisterPage } from '@/views/pages/RegisterPage';
import { createForgotPasswordPage } from '@/views/pages/ForgotPasswordPage';
import { createAppPage } from '@/views/pages/AppPage';
import { authController } from '@/controllers/auth/AuthController';
import { themeController } from '@/controllers/theme/ThemeController';

describe('Views / UI Components', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Theme toggle icon', () => {
    it('deve alternar entre ícones de lua e sol com rótulos acessíveis', () => {
      themeController.setTheme('light', false);
      const page = createAppPage();
      const button = page.querySelector<HTMLButtonElement>('#btn-toggle-theme')!;
      const initialIcon = button.querySelector('svg')?.outerHTML;

      try {
        expect(initialIcon).toBeDefined();
        expect(button.getAttribute('aria-label')).toBe('Ativar tema escuro');
        expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

        button.click();

        expect(themeController.getCurrentTheme()).toBe('dark');
        expect(button.querySelector('svg')?.outerHTML).not.toBe(initialIcon);
        expect(button.getAttribute('aria-label')).toBe('Ativar tema claro');
      } finally {
        themeController.setTheme('light', false);
      }
    });
  });

  describe('LoginPage', () => {
    it('deve renderizar a marca, o formulário e as ações de login', () => {
      const page = createLoginPage();
      document.body.appendChild(page);

      expect(page.querySelector('.brand-title')?.textContent).toContain('Event Flow');
      expect(page.querySelector('h1')?.textContent).toContain('Acesse sua conta');
      expect(page.querySelector('input#email')).not.toBeNull();
      expect(page.querySelector('input#password')).not.toBeNull();
      expect(page.querySelector('button#btn-submit')?.textContent).toContain('Entrar');
      expect(page.querySelector('button#btn-google-login')?.textContent).toContain('Entrar com Google');
      expect(page.querySelector('#link-register')).not.toBeNull();
      expect(page.querySelector('#link-forgot-password')).not.toBeNull();
    });

    it('deve exibir mensagem de erro se submeter campos vazios', () => {
      const page = createLoginPage();
      document.body.appendChild(page);

      const form = page.querySelector<HTMLFormElement>('#login-form')!;
      form.dispatchEvent(new Event('submit'));

      expect(page.querySelector('#login-feedback')?.textContent).toContain(
        'Por favor, preencha todos os campos obrigatórios.'
      );
    });
  });

  describe('RegisterPage', () => {
    it('deve renderizar o formulário com ajuda de senha e nome opcional', () => {
      const page = createRegisterPage();
      document.body.appendChild(page);

      expect(page.querySelector<HTMLInputElement>('input#name')?.required).toBe(false);
      expect(page.querySelector('input#email')).not.toBeNull();
      expect(page.querySelector('input#password')?.getAttribute('aria-describedby')).toBe('password-help');
      expect(page.querySelector('#password-help')?.textContent).toContain('Mínimo de 6 caracteres');
      expect(page.querySelector('input#confirm-password')).not.toBeNull();
      expect(page.querySelector('button#btn-register-submit')?.textContent).toContain('Criar conta');
      expect(page.querySelector('#link-login')?.textContent).toContain('Entrar');
    });

    it('deve exibir erro se senhas informadas forem divergentes', () => {
      const page = createRegisterPage();
      document.body.appendChild(page);

      page.querySelector<HTMLInputElement>('#email')!.value = 'user@eventflow.com';
      page.querySelector<HTMLInputElement>('#password')!.value = '123456';
      page.querySelector<HTMLInputElement>('#confirm-password')!.value = '654321';
      page.querySelector<HTMLFormElement>('#register-form')!.dispatchEvent(new Event('submit'));

      expect(page.querySelector('#register-feedback')?.textContent).toContain(
        'As senhas informadas não coincidem.'
      );
    });
  });

  describe('ForgotPasswordPage', () => {
    it('deve renderizar o fluxo compacto de envio e retorno ao login', () => {
      const page = createForgotPasswordPage();
      document.body.appendChild(page);

      expect(page.querySelector('.auth-card--compact')).not.toBeNull();
      expect(page.querySelector('h1')?.textContent).toBe('Recuperar senha');
      expect(page.querySelector('input#email')).not.toBeNull();
      expect(page.querySelector('button#btn-forgot-submit')?.textContent).toContain('Enviar instruções');
      expect(page.querySelector('#link-back-login')?.textContent).toContain('Voltar ao login');
    });
  });

  describe('AppPage (Página Protegida)', () => {
    it('deve apresentar uma saudação, a conta autenticada e controles de sessão', () => {
      vi.spyOn(authController, 'getState').mockReturnValue({
        user: {
          id: 'user-456',
          tenantId: 'tenant-1',
          email: 'admin@eventflow.com',
          displayName: 'Admin User',
          photoURL: null,
          themePreference: 'light',
          role: 'admin',
          status: 'active',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        },
        isAuthenticated: true,
        isLoading: false
      });

      const page = createAppPage();
      document.body.appendChild(page);

      expect(page.querySelector('h1')?.textContent).toContain('Olá, Admin User');
      expect(page.querySelector('#account-email')?.textContent).toBe('admin@eventflow.com');
      expect(page.querySelector('.app-account')?.textContent).toContain('Você entrou como');
      expect(page.querySelector('.welcome-intro')?.textContent).toContain('ainda está sendo preparada');
      expect(page.querySelector('#btn-logout')?.textContent).toContain('Sair');
      expect(page.querySelector('#btn-toggle-theme')?.getAttribute('aria-label')).toContain('tema');
      expect(page.querySelector('ul')).toBeNull();
    });

    it('deve renderizar o nome e e-mail como texto, sem interpretá-los como HTML', () => {
      vi.spyOn(authController, 'getState').mockReturnValue({
        user: {
          id: 'user-789',
          tenantId: 'tenant-1',
          email: '<script>alert(1)</script>@eventflow.com',
          displayName: '<img src=x onerror=alert(1)>',
          photoURL: null,
          themePreference: 'light',
          role: 'operator',
          status: 'active',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        },
        isAuthenticated: true,
        isLoading: false
      });

      const page = createAppPage();
      document.body.appendChild(page);

      expect(page.querySelector('#user-display-name')?.textContent).toBe('<img src=x onerror=alert(1)>');
      expect(page.querySelector('#account-email')?.textContent).toBe('<script>alert(1)</script>@eventflow.com');
      expect(page.querySelector('img, script')).toBeNull();
    });
  });
});
