import { authController } from '@/controllers/auth/AuthController';
import { themeController } from '@/controllers/theme/ThemeController';

export function createAppPage(): HTMLElement {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.minHeight = '100vh';

  const authState = authController.getState();
  const user = authState.user;
  const userEmail = user?.email || 'Usuário';
  const userName = user?.displayName || userEmail.split('@')[0];

  container.innerHTML = `
    <header class="app-header">
      <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
        <span style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary);">Event Flow</span>
      </div>

      <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
        <button 
          id="btn-toggle-theme" 
          class="theme-toggle-btn" 
          title="Alternar Tema Claro/Escuro" 
          aria-label="Alternar Tema"
        >
          🌓
        </button>

        <button 
          id="btn-logout" 
          class="btn btn-outline" 
          style="width: auto; min-height: 40px; padding: 0 var(--spacing-md); font-size: 0.875rem;"
        >
          Sair
        </button>
      </div>
    </header>

    <main class="app-main">
      <div class="welcome-card">
        <h1 style="font-size: 2.25rem; color: var(--color-primary); margin-bottom: var(--spacing-sm);">
          Hello World!
        </h1>
        <p style="font-size: 1.1rem; color: var(--color-on-surface); margin-bottom: var(--spacing-md);">
          Bem-vindo ao <strong>Event Flow</strong>, <span id="user-display-name">${userName}</span>!
        </p>
        <div style="display: inline-block; padding: var(--spacing-xs) var(--spacing-md); background-color: var(--color-surface-container); border-radius: var(--md-sys-shape-corner-small); font-size: 0.9rem; color: var(--color-on-surface-variant); margin-bottom: var(--spacing-lg);">
          Sessão autenticada: <strong>${userEmail}</strong>
        </div>

        <div style="margin-top: var(--spacing-lg); text-align: left; padding: var(--spacing-md); border-top: 1px solid var(--color-outline-variant);">
          <h2 style="font-size: 1rem; margin-bottom: var(--spacing-xs); color: var(--color-on-surface);">Status da Fundação Técnica:</h2>
          <ul style="list-style-type: none; font-size: 0.9rem; color: var(--color-on-surface-variant); line-height: 1.8;">
            <li>✅ Autenticação Firebase ativa (E-mail/Senha e Google)</li>
            <li>✅ Proteção centralizada de rotas e sessões</li>
            <li>✅ Camada de persistência Firestore Repository</li>
            <li>✅ Material Design 3 com suporte a Dark e Light Mode</li>
            <li>✅ Monólito Modular MVC pronto para expansão</li>
          </ul>
        </div>
      </div>
    </main>
  `;

  const btnLogout = container.querySelector<HTMLButtonElement>('#btn-logout')!;
  const btnToggleTheme = container.querySelector<HTMLButtonElement>('#btn-toggle-theme')!;

  btnLogout.addEventListener('click', async () => {
    btnLogout.disabled = true;
    btnLogout.innerText = 'Saindo...';
    await authController.logout();
  });

  const updateThemeIcon = (theme: 'light' | 'dark') => {
    btnToggleTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
  };

  updateThemeIcon(themeController.getCurrentTheme());

  btnToggleTheme.addEventListener('click', () => {
    const next = themeController.toggleTheme();
    updateThemeIcon(next);
  });

  return container;
}
