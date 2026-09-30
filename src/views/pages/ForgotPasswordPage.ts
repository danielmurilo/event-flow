import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';

export function createForgotPasswordPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'auth-container';

  container.innerHTML = `
    <div class="auth-card">
      <header class="auth-header">
        <h1 class="brand-title">Recuperar Senha</h1>
        <p class="auth-subtitle">Informe seu e-mail para receber as instruções</p>
      </header>

      <div id="forgot-feedback"></div>

      <form id="forgot-form" novalidate>
        <div class="form-group">
          <label for="email" class="form-label">E-mail Cadastrado</label>
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

        <button type="submit" id="btn-forgot-submit" class="btn btn-primary" style="margin-top: var(--spacing-sm);">
          <span>Enviar Instruções</span>
        </button>
      </form>

      <footer style="text-align: center; margin-top: var(--spacing-xl); font-size: 0.9rem;">
        <a href="/login" id="link-back-login">Voltar ao Login</a>
      </footer>
    </div>
  `;

  const form = container.querySelector<HTMLFormElement>('#forgot-form')!;
  const emailInput = container.querySelector<HTMLInputElement>('#email')!;
  const submitBtn = container.querySelector<HTMLButtonElement>('#btn-forgot-submit')!;
  const feedback = container.querySelector<HTMLDivElement>('#forgot-feedback')!;
  const backLink = container.querySelector<HTMLAnchorElement>('#link-back-login')!;

  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login', true);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.innerHTML = '';

    const email = emailInput.value.trim();
    if (!email) {
      feedback.innerHTML = '<div class="alert alert-error" role="alert">Por favor, informe seu e-mail.</div>';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> <span>Enviando...</span>';

    const result = await authController.forgotPassword(email);
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Enviar Instruções</span>';

    if (result.success) {
      feedback.innerHTML = '<div class="alert alert-success" role="status">Instruções enviadas para seu e-mail com sucesso!</div>';
      emailInput.value = '';
    } else if (result.error) {
      feedback.innerHTML = `<div class="alert alert-error" role="alert">${result.error}</div>`;
    }
  });

  return container;
}
