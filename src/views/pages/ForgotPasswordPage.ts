import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';

export function createForgotPasswordPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'auth-container';

  container.innerHTML = `
    <main class="auth-card auth-card--compact" aria-labelledby="forgot-title">
      <header class="auth-header">
        <p class="brand-title">Event Flow</p>
        <h1 class="auth-title" id="forgot-title">Recuperar senha</h1>
        <p class="auth-subtitle">Informe o e-mail da sua conta para receber as instruções.</p>
      </header>

      <div id="forgot-feedback"></div>

      <form id="forgot-form" novalidate>
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

        <button type="submit" id="btn-forgot-submit" class="btn btn-primary">
          <span>Enviar instruções</span>
        </button>
      </form>

      <footer class="auth-footer">
        <a href="/login" id="link-back-login" class="auth-link">Voltar ao login</a>
      </footer>
    </main>
  `;

  const form = container.querySelector<HTMLFormElement>('#forgot-form')!;
  const emailInput = container.querySelector<HTMLInputElement>('#email')!;
  const submitBtn = container.querySelector<HTMLButtonElement>('#btn-forgot-submit')!;
  const feedback = container.querySelector<HTMLDivElement>('#forgot-feedback')!;
  const backLink = container.querySelector<HTMLAnchorElement>('#link-back-login')!;

  backLink.addEventListener('click', (event) => {
    event.preventDefault();
    router.navigate('/login', true);
  });

  const showError = (message: string) => {
    feedback.innerHTML = `<div class="alert alert-error" role="alert">${message}</div>`;
  };

  const setLoading = (loading: boolean) => {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner" aria-hidden="true"></span><span>Enviando...</span>'
      : '<span>Enviar instruções</span>';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.innerHTML = '';

    const email = emailInput.value.trim();
    if (!email) {
      showError('Informe o e-mail da sua conta.');
      return;
    }

    setLoading(true);
    const result = await authController.forgotPassword(email);
    setLoading(false);

    if (result.success) {
      feedback.innerHTML = '<div class="alert alert-success" role="status">Instruções enviadas para seu e-mail.</div>';
      emailInput.value = '';
    } else if (result.error) {
      showError(result.error);
    }
  });

  return container;
}
