import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';
import { createEventsPage } from '@/views/pages/EventsPage';
import { createEventDetailsPage } from '@/views/pages/EventDetailsPage';
import { createAdminCrudPage } from '@/views/pages/AdminCrudPage';
import { IEventRepository } from '@/models/repositories/eventRepository';
import type { Event as DomainEvent } from '@/models/types/event.types';

describe('Event Flow - Módulos de Interface e Navegação', () => {
  let mockEventRepo: IEventRepository;

  const mockEvents: DomainEvent[] = [
    {
      id: 'evt-001',
      tenantId: 'buffet-gourmet',
      name: 'Casamento Sofia & Pedro',
      location: 'Espaço Villa Real - Salão Nobre',
      date_time_start: '2026-11-20T19:00:00.000Z',
      date_time_end: '2026-11-21T03:00:00.000Z',
      guests_number: 180,
      vehicle: 'Furgão Mercedes Sprinter',
      driver: 'Carlos Silva',
      event_services: [
        {
          id: 'srv-1',
          name: 'Welcome Drink',
          dishes: [
            { id: 'd-1', tenantId: 'buffet-gourmet', name: 'Clericot Cítrico', preparation_technical_sheet_ids: ['ft-1'] }
          ]
        }
      ],
      responsible_client: 'Sofia Vasconcelos',
      responsible_employee_id: 'Chef Marcelo Duarte',
      status: 'confirmed'
    },
    {
      id: 'evt-002',
      tenantId: 'buffet-gourmet',
      name: 'Convenção Anual TechSummit',
      location: 'Centro de Convenções Pro Magno',
      date_time_start: '2026-10-15T08:00:00.000Z',
      date_time_end: '2026-10-15T18:00:00.000Z',
      guests_number: 350,
      event_services: [],
      responsible_client: 'Juliana Andrade',
      responsible_employee_id: 'Paula Nogueira',
      status: 'in_expedition'
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockEventRepo = {
      listEventsByTenant: vi.fn().mockResolvedValue(mockEvents),
      findById: vi.fn().mockImplementation((id: string) => {
        const found = mockEvents.find((e) => e.id === id);
        return Promise.resolve(found || null);
      }),
      save: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    };

    vi.spyOn(authController, 'getState').mockReturnValue({
      user: {
        id: 'user-001',
        tenantId: 'buffet-gourmet',
        email: 'admin@buffetgourmet.com',
        displayName: 'Administrador Buffet',
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
  });

  describe('EventsPage (Dashboard / Lista de Eventos)', () => {
    it('deve renderizar a tabela com as colunas obrigatórias e dados do evento', async () => {
      const page = createEventsPage(mockEventRepo);
      document.body.appendChild(page);

      // Aguarda microtasks do carregamento assíncrono
      await new Promise((r) => setTimeout(r, 20));

      expect(mockEventRepo.listEventsByTenant).toHaveBeenCalledWith('buffet-gourmet');

      const table = page.querySelector('#events-table');
      expect(table).not.toBeNull();

      const rows = page.querySelectorAll('.event-table-row');
      expect(rows.length).toBe(2);

      // Validação das colunas obrigatórias
      const firstRow = rows[0];
      expect(firstRow.querySelector('.td-date-start')?.textContent).toContain('20/11/2026');
      expect(firstRow.querySelector('.event-title')?.textContent).toBe('Casamento Sofia & Pedro');
      expect(firstRow.querySelector('.responsible-tag')?.textContent).toBe('Sofia Vasconcelos');
      expect(firstRow.querySelector('.td-date-end')?.textContent).toContain('21/11/2026');
      expect(firstRow.querySelector('.status-badge')?.textContent).toBe('Confirmado');
      expect(firstRow.querySelector('.td-date-start')?.getAttribute('data-label')).toBe('Início');
      expect(firstRow.querySelector('.td-actions')?.getAttribute('data-label')).toBe('Ação');
    });

    it('deve acionar router.navigate para /events/:id ao clicar em uma linha', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const page = createEventsPage(mockEventRepo);
      document.body.appendChild(page);

      await new Promise((r) => setTimeout(r, 20));

      const firstRow = page.querySelector<HTMLElement>('.event-table-row');
      firstRow?.click();

      expect(navigateSpy).toHaveBeenCalledWith('/events/evt-001');
    });

    it('deve filtrar eventos ao digitar no campo de busca', async () => {
      const page = createEventsPage(mockEventRepo);
      document.body.appendChild(page);

      await new Promise((r) => setTimeout(r, 20));

      const searchInput = page.querySelector<HTMLInputElement>('#input-search-events')!;
      searchInput.value = 'TechSummit';
      searchInput.dispatchEvent(new window.Event('input'));

      const rows = page.querySelectorAll('.event-table-row');
      expect(rows.length).toBe(1);
      expect(rows[0].querySelector('.event-title')?.textContent).toContain('TechSummit');
    });
  });

  describe('AppShell & Menu Sanduíche (Drawer Lateral)', () => {
    it('deve conter botão de menu sanduíche e abrir o drawer ao ser clicado', () => {
      const page = createEventsPage(mockEventRepo);
      document.body.appendChild(page);

      const btnMenu = page.querySelector<HTMLButtonElement>('#btn-menu-drawer');
      const drawer = page.querySelector<HTMLElement>('#app-drawer');
      const backdrop = page.querySelector<HTMLElement>('#drawer-backdrop');

      expect(btnMenu).not.toBeNull();
      expect(drawer?.classList.contains('is-open')).toBe(false);

      btnMenu?.click();
      expect(drawer?.classList.contains('is-open')).toBe(true);
      expect(backdrop?.classList.contains('is-visible')).toBe(true);
    });

    it('deve conter todos os links obrigatórios no menu lateral', () => {
      const page = createEventsPage(mockEventRepo);
      document.body.appendChild(page);

      expect(page.querySelector('#nav-events')).not.toBeNull();
      expect(page.querySelector('#nav-categories')).not.toBeNull();
      expect(page.querySelector('#nav-ingredients')).not.toBeNull();
      expect(page.querySelector('#nav-tech-sheets')).not.toBeNull();
      expect(page.querySelector('#nav-dishes')).not.toBeNull();
      expect(page.querySelector('#nav-services')).not.toBeNull();
      expect(page.querySelector('#nav-support-materials')).not.toBeNull();
      expect(page.querySelector('#nav-users')).not.toBeNull();
    });
  });

  describe('EventDetailsPage (Ficha do Evento)', () => {
    it('deve renderizar dados gerais, cabeçalho e abas do evento', async () => {
      const page = createEventDetailsPage({ id: 'evt-001' }, mockEventRepo);
      document.body.appendChild(page);

      await new Promise((r) => setTimeout(r, 20));

      expect(mockEventRepo.findById).toHaveBeenCalledWith('evt-001', 'buffet-gourmet');
      expect(page.querySelector('#event-title')?.textContent).toBe('Casamento Sofia & Pedro');
      expect(page.querySelector('#current-status-badge')?.textContent?.trim()).toBe('Confirmado');
      expect(page.querySelector('.event-location-full')?.textContent).toContain('Espaço Villa Real');

      // Abas presentes
      expect(page.querySelector('[data-tab="tab-overview"]')).not.toBeNull();
      expect(page.querySelector('[data-tab="tab-menu"]')).not.toBeNull();
      expect(page.querySelector('[data-tab="tab-checklist"]')).not.toBeNull();
      expect(page.querySelector('[data-tab="tab-support"]')).not.toBeNull();
      expect(page.querySelectorAll('.details-tabs .tab-btn')).toHaveLength(4);
      expect(page.querySelector('[data-tab="tab-overview"]')?.getAttribute('aria-pressed')).toBe('true');
      expect(page.querySelector('#checklist-tbody .checklist-row [data-label="Item"]')).not.toBeNull();
      expect(page.querySelector('#checklist-tbody .checklist-row [data-label="Quantidade na saída"]')).not.toBeNull();

      const checklistTab = page.querySelector<HTMLButtonElement>('[data-tab="tab-checklist"]')!;
      checklistTab.click();
      expect(checklistTab.getAttribute('aria-pressed')).toBe('true');
      expect(page.querySelector('#tab-checklist')?.classList.contains('is-active')).toBe(true);
    });

    it('deve permitir alterar o status do evento', async () => {
      const page = createEventDetailsPage({ id: 'evt-001' }, mockEventRepo);
      document.body.appendChild(page);

      await new Promise((r) => setTimeout(r, 20));

      const statusSelect = page.querySelector<HTMLSelectElement>('#select-event-status')!;
      statusSelect.value = 'in_expedition';
      statusSelect.dispatchEvent(new window.Event('change'));

      expect(mockEventRepo.updateStatus).toHaveBeenCalledWith('evt-001', 'buffet-gourmet', 'in_expedition');
      expect(page.querySelector('#current-status-badge')?.textContent?.trim()).toBe('Em Expedição');
    });

    it('deve conter checklist interativo com dupla checagem (saída x retorno)', async () => {
      const page = createEventDetailsPage({ id: 'evt-001' }, mockEventRepo);
      document.body.appendChild(page);

      await new Promise((r) => setTimeout(r, 20));

      const chkExpedition = page.querySelectorAll('.chk-expedition-box');
      const chkReturn = page.querySelectorAll('.chk-return-box');

      expect(chkExpedition.length).toBeGreaterThan(0);
      expect(chkReturn.length).toBeGreaterThan(0);

      const btnSave = page.querySelector<HTMLButtonElement>('#btn-save-checklist');
      expect(btnSave).not.toBeNull();
    });
  });

  describe('AdminCrudPage & Regras de Acesso', () => {
    it('deve permitir acesso à tela de usuários para papel admin', () => {
      const page = createAdminCrudPage('/users');
      expect(page.querySelector('.restricted-access-card')).toBeNull();
      expect(page.querySelector('.page-title')?.textContent).toBe('Gestão de Utilizadores');
    });

    it('deve bloquear acesso à tela de usuários para papel operator', () => {
      vi.spyOn(authController, 'getState').mockReturnValue({
        user: {
          id: 'user-op',
          tenantId: 'buffet-gourmet',
          email: 'op@buffetgourmet.com',
          displayName: 'Operador Logística',
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

      const page = createAdminCrudPage('/users');
      expect(page.querySelector('.restricted-access-card')).not.toBeNull();
      expect(page.querySelector('h2')?.textContent).toBe('Acesso Restrito');
    });

    it('deve renderizar a página de categorias com título e tabela de itens', () => {
      const page = createAdminCrudPage('/categories');
      expect(page.querySelector('.page-title')?.textContent).toBe('Categorias de Pratos');
      expect(page.querySelector('.events-table')).not.toBeNull();
    });
  });
});
