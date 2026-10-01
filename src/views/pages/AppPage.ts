import { authController } from '@/controllers/auth/AuthController';
import { themeController } from '@/controllers/theme/ThemeController';
import moonIcon from '@/views/icons/moon.svg?raw';
import sunIcon from '@/views/icons/sun.svg?raw';

export function createAppPage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'app-shell';

  const user = authController.getState().user;
  const userEmail = user?.email ?? '';
  const userName = user?.displayName || userEmail.split('@')[0] || 'usuário';

  container.innerHTML = `
    <header class="app-header">
      <p class="brand-title app-brand">Event Flow</p>

      <div class="app-header-actions">
        <button
          type="button"
          id="btn-toggle-theme"
          class="theme-toggle-btn"
          aria-label="Alternar tema"
        ></button>
        <button type="button" id="btn-logout" class="btn btn-outline">
          Sair
        </button>
      </div>
    </header>

    <main class="app-main">
      <section class="welcome-card" aria-labelledby="welcome-title">
        <h1 class="welcome-title" id="welcome-title">Olá, <span id="user-display-name"></span></h1>
        <p class="welcome-intro">
          O Event Flow reunirá seus eventos em um só lugar. A área de gestão ainda está sendo preparada.
        </p>
        <p class="app-account">
          Você entrou como <strong id="account-email"></strong>.
        </p>
      </section>
    </main>
  `;

  container.querySelector<HTMLElement>('#user-display-name')!.textContent = userName;
  container.querySelector<HTMLElement>('#account-email')!.textContent = userEmail;

  const btnLogout = container.querySelector<HTMLButtonElement>('#btn-logout')!;
  const btnToggleTheme = container.querySelector<HTMLButtonElement>('#btn-toggle-theme')!;

  btnLogout.addEventListener('click', async () => {
    btnLogout.disabled = true;
    btnLogout.textContent = 'Saindo...';
    await authController.logout();
  });

  const updateThemeControl = (theme: import('@/models/types/user.types').ThemePreference) => {
    const isDark = theme === 'dark';
    const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
    btnToggleTheme.innerHTML = isDark ? sunIcon : moonIcon;
    const icon = btnToggleTheme.querySelector('svg');
    icon?.setAttribute('aria-hidden', 'true');
    icon?.setAttribute('focusable', 'false');
    icon?.classList.add('theme-toggle-icon');
    btnToggleTheme.setAttribute('aria-label', label);
    btnToggleTheme.setAttribute('title', label);
  };

  updateThemeControl(themeController.getCurrentTheme());

  btnToggleTheme.addEventListener('click', () => {
    updateThemeControl(themeController.toggleTheme());
  });

  return container;
}
