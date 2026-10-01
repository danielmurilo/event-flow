import { authController } from '@/controllers/auth/AuthController';
import { themeController } from '@/controllers/theme/ThemeController';
import { router } from '@/routes/router';
import { ICONS } from '@/views/icons/icons';
import moonIcon from '@/views/icons/moon.svg?raw';
import sunIcon from '@/views/icons/sun.svg?raw';

export interface NavItem {
  id: string;
  path: string;
  label: string;
  iconSvg: string;
  restrictedRoles?: Array<'admin' | 'manager'>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'nav-events', path: '/events', label: 'Eventos', iconSvg: ICONS.calendar },
  { id: 'nav-categories', path: '/categories', label: 'Categorias de Pratos', iconSvg: ICONS.tag },
  { id: 'nav-ingredients', path: '/ingredients', label: 'Ingredientes', iconSvg: ICONS.utensils },
  { id: 'nav-tech-sheets', path: '/technical-sheets', label: 'Fichas Técnicas', iconSvg: ICONS.fileText },
  { id: 'nav-dishes', path: '/dishes', label: 'Pratos', iconSvg: ICONS.utensils },
  { id: 'nav-services', path: '/services', label: 'Serviços de Eventos', iconSvg: ICONS.cocktail },
  { id: 'nav-support-materials', path: '/support-materials', label: 'Materiais de Apoio', iconSvg: ICONS.box },
  { id: 'nav-users', path: '/users', label: 'Gestão de Utilizadores', iconSvg: ICONS.users, restrictedRoles: ['admin', 'manager'] }
];

export function createAppShell(activePath: string, mainContent: HTMLElement): HTMLElement {
  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const user = authController.getState().user;
  const userEmail = user?.email ?? '';
  const userName = user?.displayName || userEmail.split('@')[0] || 'Usuário';
  const userRole = user?.role || 'operator';
  const tenantId = user?.tenantId || 'buffet-principal';

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    operator: 'Operador'
  };

  shell.innerHTML = `
    <!-- Overlay do Drawer -->
    <div id="drawer-backdrop" class="drawer-backdrop" aria-hidden="true"></div>

    <!-- Drawer Lateral -->
    <aside id="app-drawer" class="app-drawer" aria-label="Menu principal" aria-hidden="true">
      <div class="drawer-header">
        <div class="drawer-brand-block">
          <span class="drawer-brand-title">Event Flow</span>
          <span class="drawer-brand-subtitle">${tenantId}</span>
        </div>
        <button type="button" id="btn-close-drawer" class="icon-button" aria-label="Fechar menu">
          ${ICONS.close}
        </button>
      </div>

      <div class="drawer-user-card">
        <div class="user-avatar" aria-hidden="true">
          ${userName.substring(0, 2).toUpperCase()}
        </div>
        <div class="user-meta">
          <strong class="user-name" id="drawer-user-name"></strong>
          <span class="user-email" id="drawer-user-email"></span>
          <span class="user-role-badge role-${userRole}">${roleLabels[userRole] || userRole}</span>
        </div>
      </div>

      <nav class="drawer-nav">
        <ul class="nav-list">
          ${NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path || (item.path === '/events' && (activePath === '/' || activePath === '/app'));
            const isRestricted = item.restrictedRoles && !item.restrictedRoles.includes(userRole as any);

            return `
              <li class="nav-item">
                <a
                  href="${item.path}"
                  data-path="${item.path}"
                  id="${item.id}"
                  class="nav-link ${isActive ? 'is-active' : ''} ${isRestricted ? 'is-restricted' : ''}"
                  ${isRestricted ? 'title="Acesso restrito a gestores e administradores"' : ''}
                >
                  <span class="nav-icon">${item.iconSvg}</span>
                  <span class="nav-text">${item.label}</span>
                  ${isRestricted ? `<span class="lock-indicator">${ICONS.lock}</span>` : ''}
                </a>
              </li>
            `;
          }).join('')}
        </ul>
      </nav>

      <div class="drawer-footer">
        <button type="button" id="btn-drawer-logout" class="btn btn-outline drawer-logout-btn">
          Sair da Conta
        </button>
      </div>
    </aside>

    <!-- Header Global Topbar -->
    <header class="app-header">
      <div class="app-header-left">
        <button
          type="button"
          id="btn-menu-drawer"
          class="icon-button menu-toggle-btn"
          aria-label="Abrir menu"
          aria-expanded="false"
        >
          ${ICONS.menu}
        </button>
        <a href="/events" id="header-brand-link" class="brand-title app-brand" title="Ir para Eventos">
          Event Flow
        </a>
      </div>

      <div class="app-header-actions">
        <div class="user-chip" title="Conta ativa: ${userEmail}">
          <span class="user-chip-name" id="topbar-user-name"></span>
          <span class="user-chip-role role-${userRole}">${roleLabels[userRole] || userRole}</span>
        </div>
        <button
          type="button"
          id="btn-toggle-theme"
          class="theme-toggle-btn"
          aria-label="Alternar tema"
        ></button>
        <button type="button" id="btn-logout" class="btn btn-outline btn-sm">
          Sair
        </button>
      </div>
    </header>

    <!-- Conteúdo Principal -->
    <main class="app-main" id="app-main-container"></main>
  `;

  // Preenche dados do usuário de forma segura contra XSS
  shell.querySelector<HTMLElement>('#drawer-user-name')!.textContent = userName;
  shell.querySelector<HTMLElement>('#drawer-user-email')!.textContent = userEmail;
  shell.querySelector<HTMLElement>('#topbar-user-name')!.textContent = userName;

  const mainContainer = shell.querySelector<HTMLElement>('#app-main-container')!;
  mainContainer.appendChild(mainContent);

  // Controles do Drawer
  const drawer = shell.querySelector<HTMLElement>('#app-drawer')!;
  const backdrop = shell.querySelector<HTMLElement>('#drawer-backdrop')!;
  const btnOpenDrawer = shell.querySelector<HTMLButtonElement>('#btn-menu-drawer')!;
  const btnCloseDrawer = shell.querySelector<HTMLButtonElement>('#btn-close-drawer')!;

  const openDrawer = () => {
    drawer.classList.add('is-open');
    backdrop.classList.add('is-visible');
    drawer.setAttribute('aria-hidden', 'false');
    btnOpenDrawer.setAttribute('aria-expanded', 'true');
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    drawer.setAttribute('aria-hidden', 'true');
    btnOpenDrawer.setAttribute('aria-expanded', 'false');
  };

  btnOpenDrawer.addEventListener('click', openDrawer);
  btnCloseDrawer.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Tecla ESC fecha drawer
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  // Navegação pelos links do Drawer
  shell.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      if (path) {
        closeDrawer();
        router.navigate(path);
      }
    });
  });

  // Link da marca no topo
  shell.querySelector<HTMLAnchorElement>('#header-brand-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/events');
  });

  // Controles de Logout
  const handleLogout = async (btn: HTMLButtonElement) => {
    btn.disabled = true;
    btn.textContent = 'Saindo...';
    await authController.logout();
  };

  const btnLogout = shell.querySelector<HTMLButtonElement>('#btn-logout')!;
  btnLogout.addEventListener('click', () => handleLogout(btnLogout));

  const btnDrawerLogout = shell.querySelector<HTMLButtonElement>('#btn-drawer-logout')!;
  btnDrawerLogout.addEventListener('click', () => handleLogout(btnDrawerLogout));

  // Controle de Tema
  const btnToggleTheme = shell.querySelector<HTMLButtonElement>('#btn-toggle-theme')!;

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

  return shell;
}
