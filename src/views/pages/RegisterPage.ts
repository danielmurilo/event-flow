import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';

export function createRegisterPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'auth-container';

  container.innerHTML = `
    <main class="auth-card" aria-labelledby="register-title">
      <header class="auth-header">
        <p class="brand-title">Event Flow</p>
        <h1 class="auth-title" id="register-title">Criar conta</h1>
        <p class="auth-subtitle">Informe seus dados para criar sua conta.</p>
      </header>

      <div id="register-feedback"></div>

      <form id="register-form" novalidate>
        <div class="form-group">
          <label for="name" class="form-label">Nome</label>
          <input
            type="text"
            id="name"
            name="name"
            class="form-input"
            placeholder="Seu nome"
            autocomplete="name"
          />
        </div>

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
            autocomplete="new-password"
            aria-describedby="password-help"
          />
          <p class="form-help" id="password-help">Mínimo de 6 caracteres.</p>
        </div>

        <div class="form-group">
          <label for="confirm-password" class="form-label">Confirmar senha</label>
          <input
            type="password"
            id="confirm-password"
            name="confirmPassword"
            class="form-input"
            placeholder="••••••••"
            required
            autocomplete="new-password"
          />
        </div>

        <button type="submit" id="btn-register-submit" class="btn btn-primary">
          <span>Criar conta</span>
        </button>
      </form>

      <footer class="auth-footer">
        <span>Já tem uma conta?</span>
        <a href="/login" id="link-login" class="auth-link">Entrar</a>
      </footer>
    </main>
  `;

  const form = container.querySelector<HTMLFormElement>('#register-form')!;
  const nameInput = container.querySelector<HTMLInputElement>('#name')!;
  const emailInput = container.querySelector<HTMLInputElement>('#email')!;
  const passwordInput = container.querySelector<HTMLInputElement>('#password')!;
  const confirmPasswordInput = container.querySelector<HTMLInputElement>('#confirm-password')!;
  const submitBtn = container.querySelector<HTMLButtonElement>('#btn-register-submit')!;
  const feedback = container.querySelector<HTMLDivElement>('#register-feedback')!;
  const linkLogin = container.querySelector<HTMLAnchorElement>('#link-login')!;

  linkLogin.addEventListener('click', (event) => {
    event.preventDefault();
    router.navigate('/login', true);
  });

  const showError = (message: string) => {
    feedback.innerHTML = `<div class="alert alert-error" role="alert">${message}</div>`;
  };

  const setLoading = (loading: boolean) => {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner" aria-hidden="true"></span><span>Criando conta...</span>'
      : '<span>Criar conta</span>';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.innerHTML = '';

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!email || !password || !confirmPassword) {
      showError('Preencha seu e-mail, senha e confirmação de senha.');
      return;
    }

    if (password !== confirmPassword) {
      showError('As senhas informadas não coincidem.');
      return;
    }

    if (password.length < 6) {
      showError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    const result = await authController.registerWithEmail(email, password, name);
    setLoading(false);

    if (!result.success && result.error) {
      showError(result.error);
    }
  });

  return container;
}
