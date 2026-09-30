import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';

export function createLoginPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'auth-container';

  container.innerHTML = `
    <main class="auth-card" aria-labelledby="login-title">
      <header class="auth-header">
        <p class="brand-title">Event Flow</p>
        <h1 class="auth-title" id="login-title">Acesse sua conta</h1>
        <p class="auth-subtitle">Entre com seu e-mail e senha para continuar.</p>
      </header>

      <div id="login-feedback"></div>

      <form id="login-form" novalidate>
        <div class="form-group">
          <label for="email" class="form-label">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            class="form-input"
            placeholder="seu@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Senha</label>
          <input
            type="password"
            id="password"
            name="password"
            class="form-input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <div class="form-meta">
          <a href="/forgot-password" id="link-forgot-password" class="auth-link">Esqueceu a senha?</a>
        </div>

        <button type="submit" id="btn-submit" class="btn btn-primary">
          <span>Entrar</span>
        </button>
      </form>

      <div class="divider">
        <span>ou continue com</span>
      </div>

      <button type="button" id="btn-google-login" class="btn btn-google">
        <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Entrar com Google</span>
      </button>

      <footer class="auth-footer">
        <span>Não tem uma conta?</span>
        <a href="/register" id="link-register" class="auth-link">Cadastre-se</a>
      </footer>
    </main>
  `;

  const form = container.querySelector<HTMLFormElement>('#login-form')!;
  const emailInput = container.querySelector<HTMLInputElement>('#email')!;
  const passwordInput = container.querySelector<HTMLInputElement>('#password')!;
  const submitBtn = container.querySelector<HTMLButtonElement>('#btn-submit')!;
  const googleBtn = container.querySelector<HTMLButtonElement>('#btn-google-login')!;
  const feedback = container.querySelector<HTMLDivElement>('#login-feedback')!;
  const linkRegister = container.querySelector<HTMLAnchorElement>('#link-register')!;
  const linkForgot = container.querySelector<HTMLAnchorElement>('#link-forgot-password')!;

  linkRegister.addEventListener('click', (event) => {
    event.preventDefault();
    router.navigate('/register', true);
  });

  linkForgot.addEventListener('click', (event) => {
    event.preventDefault();
    router.navigate('/forgot-password', true);
  });

  const setLoading = (loading: boolean) => {
    submitBtn.disabled = loading;
    googleBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner" aria-hidden="true"></span><span>Entrando...</span>'
      : '<span>Entrar</span>';
  };

  const showError = (message: string) => {
    feedback.innerHTML = `<div class="alert alert-error" role="alert">${message}</div>`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.innerHTML = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    const result = await authController.loginWithEmail(email, password);
    setLoading(false);

    if (!result.success && result.error) {
      showError(result.error);
    }
  });

  googleBtn.addEventListener('click', async () => {
    feedback.innerHTML = '';
    setLoading(true);
    const result = await authController.loginWithGoogle();
    setLoading(false);

    if (!result.success && result.error) {
      showError(result.error);
    }
  });

  return container;
}
