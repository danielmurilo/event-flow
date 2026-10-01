import { authController } from '@/controllers/auth/AuthController';
import { eventRepository, IEventRepository } from '@/models/repositories/eventRepository';
import { Event, EventStatus } from '@/models/types/event.types';
import { router } from '@/routes/router';
import { formatDateTime } from '@/utils/dateFormatter';
import { createAppShell } from '@/views/components/AppShell';
import { ICONS } from '@/views/icons/icons';

export const STATUS_LABELS: Record<EventStatus, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'badge-draft' },
  confirmed: { label: 'Confirmado', className: 'badge-confirmed' },
  in_expedition: { label: 'Em Expedição', className: 'badge-expedition' },
  in_progress: { label: 'Em Andamento', className: 'badge-progress' },
  returned: { label: 'Retornado', className: 'badge-returned' },
  closed: { label: 'Finalizado', className: 'badge-closed' }
};

export const INITIAL_DEMO_EVENTS: Event[] = [
  {
    id: 'evt-001',
    tenantId: 'default-tenant',
    name: 'Casamento Sofia & Pedro',
    location: 'Espaço Villa Real - Salão Nobre',
    date_time_start: '2026-11-20T19:00:00.000Z',
    date_time_end: '2026-11-21T03:00:00.000Z',
    guests_number: 180,
    vehicle: 'Furgão Mercedes Sprinter (ABC-1234)',
    driver: 'Carlos Silva',
    event_services: [
      {
        id: 'srv-1',
        name: 'Welcome Drink',
        dishes: [
          { id: 'd-1', tenantId: 'default-tenant', name: 'Clericot de Frutas Cítricas', preparation_technical_sheet_ids: ['ft-1'] },
          { id: 'd-2', tenantId: 'default-tenant', name: 'Bruschetta Tradizionale', preparation_technical_sheet_ids: ['ft-2'] }
        ]
      },
      {
        id: 'srv-2',
        name: 'Jantar Buffet Franco-Americano',
        dishes: [
          { id: 'd-3', tenantId: 'default-tenant', name: 'Filé Mignon ao Molho Roti', preparation_technical_sheet_ids: ['ft-3'] },
          { id: 'd-4', tenantId: 'default-tenant', name: 'Risoto de Alho-Poró com Parmesão', preparation_technical_sheet_ids: ['ft-4'] }
        ]
      }
    ],
    responsible_client: 'Sofia Vasconcelos',
    responsible_employee_id: 'Chef Marcelo Duarte',
    notes: 'Atenção redobrada para itens sem glúten na ilha de antepastos.',
    status: 'confirmed'
  },
  {
    id: 'evt-002',
    tenantId: 'default-tenant',
    name: 'Convenção Anual TechSummit 2026',
    location: 'Centro de Convenções Pro Magno - Pavilhão A',
    date_time_start: '2026-10-15T08:00:00.000Z',
    date_time_end: '2026-10-15T18:00:00.000Z',
    guests_number: 350,
    vehicle: 'Caminhão Baú VW 9-170 (XYZ-9876)',
    driver: 'Rogério Mendes',
    event_services: [
      {
        id: 'srv-3',
        name: 'Coffee Break Boas-Vindas',
        dishes: [
          { id: 'd-5', tenantId: 'default-tenant', name: 'Mini Croissants & Quiches', preparation_technical_sheet_ids: ['ft-5'] }
        ]
      },
      {
        id: 'srv-4',
        name: 'Almoço Executivo',
        dishes: [
          { id: 'd-6', tenantId: 'default-tenant', name: 'Salmão Grelhado com Legumes Rústicos', preparation_technical_sheet_ids: ['ft-6'] }
        ]
      }
    ],
    responsible_client: 'Juliana Andrade (TechCorp)',
    responsible_employee_id: 'Paula Nogueira',
    notes: 'Montagem deve estar 100% pronta até às 07h15 impreterivelmente.',
    status: 'in_expedition'
  },
  {
    id: 'evt-003',
    tenantId: 'default-tenant',
    name: 'Aniversário 50 Anos Dr. Roberto',
    location: 'Residência Alphaville 2 - Alameda das Acácias, 450',
    date_time_start: '2026-10-05T13:00:00.000Z',
    date_time_end: '2026-10-05T20:00:00.000Z',
    guests_number: 60,
    vehicle: 'Furgão Fiorino Refrigerado',
    driver: 'Marcos Souza',
    event_services: [
      {
        id: 'srv-5',
        name: 'Churrasco Gourmet & Bar de Caipirinhas',
        dishes: [
          { id: 'd-7', tenantId: 'default-tenant', name: 'Picanha Angus Fatiada', preparation_technical_sheet_ids: ['ft-7'] }
        ]
      }
    ],
    responsible_client: 'Roberto Almeida',
    responsible_employee_id: 'Carlos Silva',
    notes: 'Cliente solicitou barman dedicado durante todo o evento.',
    status: 'closed'
  }
];

export function createEventsPage(repository: IEventRepository = eventRepository): HTMLElement {
  const content = document.createElement('div');
  content.className = 'events-page-view';

  const user = authController.getState().user;
  const tenantId = user?.tenantId || 'default-tenant';

  content.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">Gestão de Eventos</h1>
        <p class="page-subtitle">Acompanhe a operação, cardápios e logística de expedição do buffet.</p>
      </div>
      <div class="header-action-group">
        <button type="button" id="btn-create-event" class="btn btn-primary">
          <span class="btn-icon">${ICONS.plus}</span>
          Novo Evento
        </button>
      </div>
    </div>

    <!-- Barra de Filtros e Busca -->
    <section class="filters-card" aria-label="Filtros da lista">
      <div class="search-input-wrapper">
        <span class="search-icon">${ICONS.search}</span>
        <input
          type="search"
          id="input-search-events"
          class="form-control search-input"
          placeholder="Buscar por nome do evento, responsável ou local..."
          aria-label="Buscar eventos"
        />
      </div>

      <div class="status-filters" id="status-filters-group">
        <button type="button" class="filter-chip is-active" data-status="all">Todos</button>
        <button type="button" class="filter-chip" data-status="confirmed">Confirmados</button>
        <button type="button" class="filter-chip" data-status="in_expedition">Em Expedição</button>
        <button type="button" class="filter-chip" data-status="in_progress">Em Andamento</button>
        <button type="button" class="filter-chip" data-status="returned">Retornados</button>
        <button type="button" class="filter-chip" data-status="closed">Finalizados</button>
      </div>
    </section>

    <!-- Tabela / Lista de Eventos -->
    <section class="table-container-card" id="events-table-wrapper" aria-live="polite">
      <div class="loading-state" id="events-loading">
        <div class="spinner"></div>
        <p>Carregando eventos da empresa...</p>
      </div>
      <div class="table-responsive" id="table-scroll-area" style="display: none;">
        <table class="events-table" id="events-table">
          <thead>
            <tr>
              <th scope="col">Data Início</th>
              <th scope="col">Nome do Evento</th>
              <th scope="col">Responsável</th>
              <th scope="col">Data Fim</th>
              <th scope="col">Status</th>
              <th scope="col" class="th-actions">Ação</th>
            </tr>
          </thead>
          <tbody id="events-table-body"></tbody>
        </table>
      </div>
      <div id="events-empty" class="empty-state" style="display: none;">
        <div class="empty-icon">${ICONS.calendar}</div>
        <h3>Nenhum evento encontrado</h3>
        <p>Não há eventos correspondentes aos filtros selecionados.</p>
      </div>
    </section>
  `;

  const tbody = content.querySelector<HTMLTableSectionElement>('#events-table-body')!;
  const loadingEl = content.querySelector<HTMLElement>('#events-loading')!;
  const tableArea = content.querySelector<HTMLElement>('#table-scroll-area')!;
  const emptyEl = content.querySelector<HTMLElement>('#events-empty')!;
  const searchInput = content.querySelector<HTMLInputElement>('#input-search-events')!;
  const statusChips = content.querySelectorAll<HTMLButtonElement>('.filter-chip');
  const btnCreate = content.querySelector<HTMLButtonElement>('#btn-create-event')!;

  let allEvents: Event[] = [];
  let currentFilter = 'all';
  let searchTerm = '';

  const renderEventsTable = (eventsToRender: Event[]) => {
    tbody.innerHTML = '';

    if (eventsToRender.length === 0) {
      tableArea.style.display = 'none';
      emptyEl.style.display = 'flex';
      return;
    }

    tableArea.style.display = 'block';
    emptyEl.style.display = 'none';

    eventsToRender.forEach((evt) => {
      const tr = document.createElement('tr');
      tr.className = 'event-table-row';
      tr.setAttribute('data-event-id', evt.id);
      tr.setAttribute('tabindex', '0');
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', `Ver detalhes do evento ${evt.name}`);

      const statusMeta = STATUS_LABELS[evt.status] || { label: evt.status, className: 'badge-neutral' };
      const responsible = evt.responsible_client || evt.responsible_employee_id || 'Não informado';

      tr.innerHTML = `
        <td class="td-date-start">
          <strong>${formatDateTime(evt.date_time_start)}</strong>
        </td>
        <td class="td-name">
          <div class="event-name-block">
            <span class="event-title">${evt.name}</span>
            <span class="event-location" title="${evt.location}">
              <span class="location-icon">${ICONS.mapPin}</span>
              ${evt.location}
            </span>
          </div>
        </td>
        <td class="td-responsible">
          <span class="responsible-tag">${responsible}</span>
          ${evt.guests_number ? `<span class="guests-tag">${evt.guests_number} pax</span>` : ''}
        </td>
        <td class="td-date-end">
          <span>${formatDateTime(evt.date_time_end)}</span>
        </td>
        <td class="td-status">
          <span class="status-badge ${statusMeta.className}">${statusMeta.label}</span>
        </td>
        <td class="td-actions">
          <button type="button" class="btn btn-sm btn-ghost btn-view-event" aria-label="Acessar ${evt.name}">
            Detalhes →
          </button>
        </td>
      `;

      // Clique na linha ou no botão de detalhes redireciona para /events/:id
      const navigateToDetails = () => {
        router.navigate(`/events/${evt.id}`);
      };

      tr.addEventListener('click', navigateToDetails);
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToDetails();
        }
      });

      tbody.appendChild(tr);
    });
  };

  const applyFilters = () => {
    let filtered = allEvents;

    if (currentFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === currentFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(term) ||
        e.location.toLowerCase().includes(term) ||
        (e.responsible_client && e.responsible_client.toLowerCase().includes(term)) ||
        (e.responsible_employee_id && e.responsible_employee_id.toLowerCase().includes(term))
      );
    }

    renderEventsTable(filtered);
  };

  // Carrega eventos do Firestore Repository
  const loadEvents = async () => {
    loadingEl.style.display = 'flex';
    tableArea.style.display = 'none';
    emptyEl.style.display = 'none';

    try {
      let events = await repository.listEventsByTenant(tenantId);

      // Se repositório retornar vazio (ex: novo tenant ou ambiente sem dados), carrega eventos de exemplo
      if (events.length === 0) {
        events = INITIAL_DEMO_EVENTS.map(e => ({ ...e, tenantId }));
        // Tenta salvar demo no repositório de forma não bloqueante
        Promise.all(events.map(e => repository.save(e))).catch(() => {});
      }

      allEvents = events;
      loadingEl.style.display = 'none';
      applyFilters();
    } catch (err) {
      console.warn('Falha ao carregar eventos do Firestore, usando dados locais de demonstração:', err);
      allEvents = INITIAL_DEMO_EVENTS.map(e => ({ ...e, tenantId }));
      loadingEl.style.display = 'none';
      applyFilters();
    }
  };

  // Eventos de filtro
  searchInput.addEventListener('input', (e) => {
    searchTerm = (e.target as HTMLInputElement).value;
    applyFilters();
  });

  statusChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      statusChips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      currentFilter = chip.getAttribute('data-status') || 'all';
      applyFilters();
    });
  });

  // Botão criar novo evento (adiciona um evento rápido e redireciona)
  btnCreate.addEventListener('click', async () => {
    const newId = `evt-${Date.now().toString(36)}`;
    const now = new Date();
    const end = new Date(now.getTime() + 5 * 3600000);

    const newEvent: Event = {
      id: newId,
      tenantId,
      name: `Novo Evento Gastronómico ${allEvents.length + 1}`,
      location: 'Buffet Espaço Jardins - Sala Principal',
      date_time_start: now.toISOString(),
      date_time_end: end.toISOString(),
      guests_number: 100,
      responsible_client: 'Cliente Corporativo',
      responsible_employee_id: user?.displayName || 'Equipe Buffet',
      event_services: [],
      status: 'draft'
    };

    try {
      await repository.save(newEvent);
    } catch (e) {
      console.warn('Erro ao salvar no Firestore:', e);
    }

    allEvents.unshift(newEvent);
    applyFilters();
    router.navigate(`/events/${newId}`);
  });

  // Dispara carregamento assíncrono
  loadEvents();

  return createAppShell('/events', content);
}
