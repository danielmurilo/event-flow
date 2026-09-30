import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLoginPage } from '@/views/pages/LoginPage';
import { createRegisterPage } from '@/views/pages/RegisterPage';
import { createForgotPasswordPage } from '@/views/pages/ForgotPasswordPage';
import { createAppPage } from '@/views/pages/AppPage';
import { authController } from '@/controllers/auth/AuthController';

describe('Views / UI Components', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('LoginPage', () => {
    it('deve renderizar os elementos essenciais da página de login', () => {
      const page = createLoginPage();
      document.body.appendChild(page);

      expect(page.querySelector('.brand-title')?.textContent).toContain('Event Flow');
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

      const feedback = page.querySelector('#login-feedback');
      expect(feedback?.textContent).toContain('Por favor, preencha todos os campos obrigatórios.');
    });
  });

  describe('RegisterPage', () => {
    it('deve renderizar o formulário de cadastro com todos os campos necessários', () => {
      const page = createRegisterPage();
      document.body.appendChild(page);

      expect(page.querySelector('input#name')).not.toBeNull();
      expect(page.querySelector('input#email')).not.toBeNull();
      expect(page.querySelector('input#password')).not.toBeNull();
      expect(page.querySelector('input#confirm-password')).not.toBeNull();
      expect(page.querySelector('button#btn-register-submit')?.textContent).toContain('Cadastrar');
      expect(page.querySelector('#link-login')).not.toBeNull();
    });

    it('deve exibir erro se senhas informadas forem divergentes', () => {
      const page = createRegisterPage();
      document.body.appendChild(page);

      const emailInput = page.querySelector<HTMLInputElement>('#email')!;
      const passInput = page.querySelector<HTMLInputElement>('#password')!;
      const confirmInput = page.querySelector<HTMLInputElement>('#confirm-password')!;
      const form = page.querySelector<HTMLFormElement>('#register-form')!;

      emailInput.value = 'user@eventflow.com';
      passInput.value = '123456';
      confirmInput.value = '654321';

      form.dispatchEvent(new Event('submit'));

      const feedback = page.querySelector('#register-feedback');
      expect(feedback?.textContent).toContain('As senhas informadas não coincidem.');
    });
  });

  describe('ForgotPasswordPage', () => {
    it('deve renderizar o campo de e-mail e botão de envio', () => {
      const page = createForgotPasswordPage();
      document.body.appendChild(page);

      expect(page.querySelector('input#email')).not.toBeNull();
      expect(page.querySelector('button#btn-forgot-submit')).not.toBeNull();
      expect(page.querySelector('#link-back-login')).not.toBeNull();
    });
  });

  describe('AppPage (Página Protegida)', () => {
    it('deve renderizar Hello World!, informações do usuário logado, botão de logout e alternador de tema', () => {
      vi.spyOn(authController, 'getState').mockReturnValue({
        user: {
          id: 'user-456',
          email: 'admin@eventflow.com',
          displayName: 'Admin User'
        },
        isAuthenticated: true,
        isLoading: false
      });

      const page = createAppPage();
      document.body.appendChild(page);

      expect(page.querySelector('h1')?.textContent).toContain('Hello World!');
      expect(page.querySelector('#user-display-name')?.textContent).toBe('Admin User');
      expect(page.querySelector('#btn-logout')?.textContent).toContain('Sair');
      expect(page.querySelector('#btn-toggle-theme')).not.toBeNull();
    });
  });
});
