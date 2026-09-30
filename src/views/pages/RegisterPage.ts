import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';

export function createRegisterPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'auth-container';

  container.innerHTML = `
    <div class="auth-card">
      <header class="auth-header">
        <h1 class="brand-title">Criar Conta</h1>
        <p class="auth-subtitle">Junte-se ao Event Flow</p>
      </header>

      <div id="register-feedback"></div>

      <form id="register-form" novalidate>
        <div class="form-group">
          <label for="name" class="form-label">Nome Completo</label>
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
          <label for="password" class="form-label">Senha (mínimo 6 caracteres)</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            class="form-input" 
            placeholder="••••••••" 
            required 
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="confirm-password" class="form-label">Confirmar Senha</label>
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

        <button type="submit" id="btn-register-submit" class="btn btn-primary" style="margin-top: var(--spacing-sm);">
          <span>Cadastrar</span>
        </button>
      </form>

      <footer style="text-align: center; margin-top: var(--spacing-xl); font-size: 0.9rem;">
        <span style="color: var(--color-on-surface-variant);">Já possui uma conta?</span>
        <a href="/login" id="link-login" style="margin-left: 4px;">Fazer Login</a>
      </footer>
    </div>
  `;

  const form = container.querySelector<HTMLFormElement>('#register-form')!;
  const nameInput = container.querySelector<HTMLInputElement>('#name')!;
  const emailInput = container.querySelector<HTMLInputElement>('#email')!;
  const passwordInput = container.querySelector<HTMLInputElement>('#password')!;
  const confirmPasswordInput = container.querySelector<HTMLInputElement>('#confirm-password')!;
  const submitBtn = container.querySelector<HTMLButtonElement>('#btn-register-submit')!;
  const feedback = container.querySelector<HTMLDivElement>('#register-feedback')!;
  const linkLogin = container.querySelector<HTMLAnchorElement>('#link-login')!;

  linkLogin.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login', true);
  });

  const showError = (msg: string) => {
    feedback.innerHTML = `<div class="alert alert-error" role="alert">${msg}</div>`;
  };

  const setLoading = (loading: boolean) => {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading 
      ? '<span class="spinner"></span> <span>Cadastrando...</span>' 
      : '<span>Cadastrar</span>';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.innerHTML = '';

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!email || !password || !confirmPassword) {
      showError('Por favor, preencha todos os campos obrigatórios.');
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
