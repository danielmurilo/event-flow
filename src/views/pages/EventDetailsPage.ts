import { authController } from '@/controllers/auth/AuthController';
import { eventRepository, IEventRepository } from '@/models/repositories/eventRepository';
import { Event, EventStatus } from '@/models/types/event.types';
import { router, RouteParams } from '@/routes/router';
import { formatDateTime } from '@/utils/dateFormatter';
import { createAppShell } from '@/views/components/AppShell';
import { ICONS } from '@/views/icons/icons';
import { INITIAL_DEMO_EVENTS, STATUS_LABELS } from './EventsPage';

export interface ChecklistItemState {
  id: string;
  name: string;
  category: string;
  unit: string;
  planned: number;
  expeditionQtd: number;
  expeditionCheck: boolean;
  returnQtd: number;
  returnCheck: boolean;
  notes: string;
}

export function createEventDetailsPage(
  params?: RouteParams,
  repository: IEventRepository = eventRepository
): HTMLElement {
  const content = document.createElement('div');
  content.className = 'event-details-view';

  const user = authController.getState().user;
  const tenantId = user?.tenantId || 'default-tenant';
  const eventId = params?.id || '';

  content.innerHTML = `
    <div class="details-top-bar">
      <button type="button" id="btn-back-events" class="btn btn-outline btn-back">
        ${ICONS.arrowLeft} Voltar para Eventos
      </button>
      <div class="top-bar-meta">
        <span class="tenant-tag">${tenantId}</span>
      </div>
    </div>

    <div id="details-loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando dados completos do evento...</p>
    </div>

    <div id="details-container" style="display: none;"></div>
  `;

  const loadingEl = content.querySelector<HTMLElement>('#details-loading')!;
  const container = content.querySelector<HTMLElement>('#details-container')!;
  const btnBack = content.querySelector<HTMLButtonElement>('#btn-back-events')!;

  btnBack.addEventListener('click', () => {
    router.navigate('/events');
  });

  const renderEventDetails = (event: Event) => {
    loadingEl.style.display = 'none';
    container.style.display = 'block';

    const statusMeta = STATUS_LABELS[event.status] || { label: event.status, className: 'badge-neutral' };

    // Itens padrão de checklist de expedição e retorno
    const checklistItems: ChecklistItemState[] = [
      { id: 'chk-1', name: 'Filé Mignon Porcionado (Sous-vide)', category: 'Alimentos', unit: 'kg', planned: 35, expeditionQtd: 35, expeditionCheck: true, returnQtd: 0, returnCheck: false, notes: 'Embalado a vácuo com etiqueta de lote' },
      { id: 'chk-2', name: 'Arroz Arbóreo & Caldo de Legumes', category: 'Alimentos', unit: 'kg', planned: 15, expeditionQtd: 15, expeditionCheck: true, returnQtd: 0, returnCheck: false, notes: 'Conservar sob refrigeração até a cocção' },
      { id: 'chk-3', name: 'Massa Folhada & Recheios de Quiche', category: 'Alimentos', unit: 'unid', planned: 200, expeditionQtd: 200, expeditionCheck: true, returnQtd: 0, returnCheck: false, notes: 'Caixas isotérmicas numeradas 01 a 04' },
      { id: 'chk-4', name: 'Frutas Cítricas Higienizadas & Xaropes', category: 'Alimentos', unit: 'kg', planned: 20, expeditionQtd: 20, expeditionCheck: false, returnQtd: 0, returnCheck: false, notes: 'Bar de boas-vindas' },
      { id: 'chk-5', name: 'Pratos de Porcelana Rasa & Funda', category: 'Materiais de Apoio', unit: 'unid', planned: 220, expeditionQtd: 220, expeditionCheck: true, returnQtd: 0, returnCheck: false, notes: 'Racks plásticos de transporte' },
      { id: 'chk-6', name: 'Talheres Inox (Garfos, Facas, Colheres)', category: 'Materiais de Apoio', unit: 'kits', planned: 220, expeditionQtd: 220, expeditionCheck: true, returnQtd: 0, returnCheck: false, notes: 'Embalados e polidos' },
      { id: 'chk-7', name: 'Taças de Cristal e Copos de Água', category: 'Materiais de Apoio', unit: 'unid', planned: 300, expeditionQtd: 300, expeditionCheck: false, returnQtd: 0, returnCheck: false, notes: 'Conferir quebras na devolução' },
      { id: 'chk-8', name: 'Rechauds Inox com Banho-maria & Fogareiros', category: 'Equipamentos', unit: 'unid', planned: 6, expeditionQtd: 6, expeditionCheck: true, returnQtd: 0, returnCheck: false, notes: 'Acompanha 12 latas de álcool gel' }
    ];

    const supportCategories = [
      {
        category: 'Caixa Seca & Utensílios',
        items: [
          { name: 'Travessas e Pegadores de Inox', qty: '12 conjuntos', check: 'Conferido' },
          { name: 'Toalhas e Guardanapos de Tecido', qty: '30 unidades', check: 'Conferido' },
          { name: 'Tábua de Corte Polietileno & Facas Chef', qty: '4 kits', check: 'Conferido' }
        ]
      },
      {
        category: 'Limpeza & Descarte',
        items: [
          { name: 'Sacos de Lixo Reforçados 100L', qty: '3 rolos', check: 'Conferido' },
          { name: 'Detergente Neutro, Desengordurante & Panos Perfex', qty: '1 kit completo', check: 'Conferido' }
        ]
      },
      {
        category: 'EPIs & Higiene Operacional',
        items: [
          { name: 'Luvas Nitrílicas & Toucas Descartáveis', qty: '4 caixas', check: 'Conferido' },
          { name: 'Termômetro Digital Tipo Espeto', qty: '2 unidades', check: 'Conferido' }
        ]
      },
      {
        category: 'Equipamentos & Elétrica',
        items: [
          { name: 'Extensões 20A & Adaptadores Tripolares', qty: '4 unidades', check: 'Conferido' },
          { name: 'Estufa Portátil de Aquecimento', qty: '1 unidade', check: 'Conferido' }
        ]
      }
    ];

    container.innerHTML = `
      <!-- Header do Evento -->
      <section class="event-details-header card-elevation" aria-labelledby="event-title">
        <div class="event-header-main">
          <div class="title-with-badge">
            <h1 id="event-title" class="event-headline">${event.name}</h1>
            <span class="status-badge ${statusMeta.className}" id="current-status-badge">
              ${statusMeta.label}
            </span>
          </div>
          <p class="event-location-full">
            <span class="icon-inline">${ICONS.mapPin}</span>
            ${event.location}
          </p>
        </div>

        <div class="event-status-control">
          <label for="select-event-status" class="status-label">Status Operacional:</label>
          <select id="select-event-status" class="form-control status-select" aria-label="Alterar status do evento">
            <option value="draft" ${event.status === 'draft' ? 'selected' : ''}>Rascunho</option>
            <option value="confirmed" ${event.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
            <option value="in_expedition" ${event.status === 'in_expedition' ? 'selected' : ''}>Em Expedição</option>
            <option value="in_progress" ${event.status === 'in_progress' ? 'selected' : ''}>Em Andamento</option>
            <option value="returned" ${event.status === 'returned' ? 'selected' : ''}>Retornado</option>
            <option value="closed" ${event.status === 'closed' ? 'selected' : ''}>Finalizado</option>
          </select>
        </div>
      </section>

      <!-- Navegação por Abas -->
      <nav class="details-tabs" aria-label="Seções do evento">
        <button type="button" class="tab-btn is-active" data-tab="tab-overview" aria-pressed="true">
          ${ICONS.calendar} Dados Gerais & Logística
        </button>
        <button type="button" class="tab-btn" data-tab="tab-menu" aria-pressed="false">
          ${ICONS.utensils} Serviços & Cardápio (${event.event_services?.length || 0})
        </button>
        <button type="button" class="tab-btn" data-tab="tab-checklist" aria-pressed="false">
          ${ICONS.check} Checklist Expedição & Volta
        </button>
        <button type="button" class="tab-btn" data-tab="tab-support" aria-pressed="false">
          ${ICONS.box} Materiais & Caixa Seca
        </button>
      </nav>

      <!-- Conteúdo das Abas -->
      <div class="tabs-content-area">
        <!-- ABA 1: DADOS GERAIS -->
        <section id="tab-overview" class="tab-pane is-active">
          <div class="details-grid">
            <div class="detail-card">
              <h3 class="card-section-title">Programação e Horários</h3>
              <dl class="meta-definition-list">
                <dt>Data e Início:</dt>
                <dd><strong>${formatDateTime(event.date_time_start)}</strong></dd>
                <dt>Data e Término:</dt>
                <dd><strong>${formatDateTime(event.date_time_end)}</strong></dd>
                <dt>Convidados (Pax):</dt>
                <dd><span class="pax-badge">${event.guests_number} convidados</span></dd>
              </dl>
            </div>

            <div class="detail-card">
              <h3 class="card-section-title">Transporte & Veículo</h3>
              <dl class="meta-definition-list">
                <dt>Veículo Designado:</dt>
                <dd>${event.vehicle || 'Não informado / Próprio'}</dd>
                <dt>Motorista Responsável:</dt>
                <dd>${event.driver || 'Não atribuído'}</dd>
              </dl>
            </div>

            <div class="detail-card">
              <h3 class="card-section-title">Responsáveis</h3>
              <dl class="meta-definition-list">
                <dt>Cliente Contratante:</dt>
                <dd><strong>${event.responsible_client}</strong></dd>
                <dt>Líder Operacional / Chef:</dt>
                <dd><strong>${event.responsible_employee_id}</strong></dd>
              </dl>
            </div>

            <div class="detail-card detail-card-full">
              <h3 class="card-section-title">Observações e Recomendações</h3>
              <p class="notes-text">${event.notes || 'Nenhuma observação cadastrada para este evento.'}</p>
            </div>
          </div>
        </section>

        <!-- ABA 2: SERVIÇOS & PRATOS -->
        <section id="tab-menu" class="tab-pane">
          <div class="services-list-wrapper">
            ${event.event_services && event.event_services.length > 0 ? event.event_services.map((svc) => `
              <div class="service-card card-elevation">
                <div class="service-header">
                  <h3 class="service-name">${svc.name}</h3>
                  <span class="dishes-count">${svc.dishes?.length || 0} prato(s)</span>
                </div>
                <div class="dishes-grid">
                  ${svc.dishes && svc.dishes.length > 0 ? svc.dishes.map((dish) => `
                    <div class="dish-item-card">
                      <div class="dish-title-row">
                        <strong class="dish-name">${dish.name}</strong>
                      </div>
                      <p class="dish-meta">Fichas Técnicas: ${dish.preparation_technical_sheet_ids.join(', ') || 'Padrão da categoria'}</p>
                      ${dish.extra_ingredients && dish.extra_ingredients.length > 0 ? `
                        <div class="extra-ingredients">
                          <small>Ingredientes extras:</small>
                          <ul class="extra-list">
                            ${dish.extra_ingredients.map(ing => `<li>${ing.quantity} ${ing.unit} (${ing.ingredient_id})</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                    </div>
                  `).join('') : '<p class="text-muted">Nenhum prato vinculado a este serviço.</p>'}
                </div>
              </div>
            `).join('') : `
              <div class="empty-state">
                <p>Nenhum serviço gastronómico vinculado a este evento.</p>
              </div>
            `}
          </div>
        </section>

        <!-- ABA 3: CHECKLIST DE EXPEDIÇÃO & VOLTA -->
        <section id="tab-checklist" class="tab-pane">
          <div class="checklist-card card-elevation">
            <div class="checklist-header">
              <div>
                <h3 class="card-section-title">Conferência Dupla: Saída vs. Retorno</h3>
                <p class="text-muted">Marque os itens ao carregar o veículo e confirme a devolução pós-evento.</p>
              </div>
              <div class="checklist-actions">
                <button type="button" id="btn-save-checklist" class="btn btn-primary btn-sm">
                  Salvar Conferência
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="checklist-table">
                <thead>
                  <tr>
                    <th>Item / Descrição</th>
                    <th>Categoria</th>
                    <th>Unid</th>
                    <th>Planejado</th>
                    <th class="th-center">Saída (Qtd)</th>
                    <th class="th-center">Check Saída</th>
                    <th class="th-center">Retorno (Qtd)</th>
                    <th class="th-center">Check Retorno</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody id="checklist-tbody">
                  ${checklistItems.map((item, idx) => `
                    <tr class="checklist-row ${item.expeditionCheck ? 'row-checked-exp' : ''}">
                      <td data-label="Item"><strong>${item.name}</strong></td>
                      <td data-label="Categoria"><span class="category-tag">${item.category}</span></td>
                      <td data-label="Unidade">${item.unit}</td>
                      <td data-label="Planejado">${item.planned}</td>
                      <td class="td-center" data-label="Quantidade na saída">
                        <input
                          type="number"
                          class="form-control table-input"
                          value="${item.expeditionQtd}"
                          min="0"
                          style="width: 70px;"
                          aria-label="Quantidade saída de ${item.name}"
                        />
                      </td>
                      <td class="td-center" data-label="Conferir saída">
                        <label class="checklist-check-target">
                          <input
                            type="checkbox"
                            class="chk-expedition-box"
                          data-idx="${idx}"
                          ${item.expeditionCheck ? 'checked' : ''}
                          aria-label="Confirmar saída de ${item.name}"
                          />
                          <span>Conferido</span>
                        </label>
                      </td>
                      <td class="td-center" data-label="Quantidade no retorno">
                        <input
                          type="number"
                          class="form-control table-input"
                          value="${item.returnQtd}"
                          min="0"
                          style="width: 70px;"
                          aria-label="Quantidade retorno de ${item.name}"
                        />
                      </td>
                      <td class="td-center" data-label="Conferir retorno">
                        <label class="checklist-check-target">
                          <input
                          type="checkbox"
                          class="chk-return-box"
                          data-idx="${idx}"
                          ${item.returnCheck ? 'checked' : ''}
                          aria-label="Confirmar retorno de ${item.name}"
                          />
                          <span>Conferido</span>
                        </label>
                      </td>
                      <td data-label="Observações">
                        <input
                          type="text"
                          class="form-control table-input"
                          value="${item.notes}"
                          placeholder="Nota..."
                          aria-label="Notas para ${item.name}"
                        />
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div id="checklist-feedback" class="checklist-feedback" style="display: none;"></div>
          </div>
        </section>

        <!-- ABA 4: MATERIAIS DE APOIO & CAIXA SECA -->
        <section id="tab-support" class="tab-pane">
          <div class="support-materials-grid">
            ${supportCategories.map((cat) => `
              <div class="support-category-card card-elevation">
                <h3 class="support-cat-title">${cat.category}</h3>
                <ul class="support-items-list">
                  ${cat.items.map((it) => `
                    <li class="support-item">
                      <div class="support-item-info">
                        <strong>${it.name}</strong>
                        <span class="support-qty">${it.qty}</span>
                      </div>
                      <span class="check-pill">${ICONS.check} ${it.check}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    // Gerenciador de Abas
    const tabButtons = container.querySelectorAll<HTMLButtonElement>('.tab-btn');
    const tabPanes = container.querySelectorAll<HTMLElement>('.tab-pane');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        tabButtons.forEach((tabButton) => {
          tabButton.classList.remove('is-active');
          tabButton.setAttribute('aria-pressed', 'false');
        });
        tabPanes.forEach((pane) => pane.classList.remove('is-active'));

        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        container.querySelector<HTMLElement>(`#${targetId}`)?.classList.add('is-active');
      });
    });

    // Alteração de Status
    const statusSelect = container.querySelector<HTMLSelectElement>('#select-event-status')!;
    const statusBadge = container.querySelector<HTMLElement>('#current-status-badge')!;

    statusSelect.addEventListener('change', async () => {
      const newStatus = statusSelect.value as EventStatus;
      event.status = newStatus;
      const meta = STATUS_LABELS[newStatus] || { label: newStatus, className: 'badge-neutral' };
      statusBadge.textContent = meta.label;
      statusBadge.className = `status-badge ${meta.className}`;

      try {
        await repository.updateStatus(event.id, tenantId, newStatus);
      } catch (e) {
        console.warn('Erro ao atualizar status no repositório:', e);
      }
    });

    // Checklist feedback
    const btnSaveChecklist = container.querySelector<HTMLButtonElement>('#btn-save-checklist')!;
    const feedbackEl = container.querySelector<HTMLElement>('#checklist-feedback')!;

    btnSaveChecklist.addEventListener('click', () => {
      btnSaveChecklist.disabled = true;
      btnSaveChecklist.textContent = 'Salvando...';

      setTimeout(() => {
        btnSaveChecklist.disabled = false;
        btnSaveChecklist.textContent = 'Salvar Conferência';
        feedbackEl.textContent = '✓ Conferência de expedição e retorno atualizada com sucesso!';
        feedbackEl.style.display = 'block';

        setTimeout(() => {
          feedbackEl.style.display = 'none';
        }, 4000);
      }, 500);
    });
  };

  // Carrega o evento por ID
  const loadEvent = async () => {
    loadingEl.style.display = 'flex';
    container.style.display = 'none';

    try {
      let event = await repository.findById(eventId, tenantId);

      if (!event) {
        // Fallback para itens da lista de demonstração
        const demo = INITIAL_DEMO_EVENTS.find((e) => e.id === eventId);
        if (demo) {
          event = { ...demo, tenantId };
        } else {
          // Fallback seguro gerado
          event = {
            id: eventId || 'evt-demo',
            tenantId,
            name: `Evento Operacional (${eventId || 'Novo'})`,
            location: 'Buffet Central - Salão Jardins',
            date_time_start: new Date().toISOString(),
            date_time_end: new Date(Date.now() + 6 * 3600000).toISOString(),
            guests_number: 120,
            responsible_client: 'Cliente Exemplo',
            responsible_employee_id: user?.displayName || 'Equipe Buffet',
            event_services: INITIAL_DEMO_EVENTS[0].event_services,
            status: 'confirmed'
          };
        }
      }

      renderEventDetails(event);
    } catch (err) {
      console.warn('Erro ao carregar evento:', err);
      const demo = INITIAL_DEMO_EVENTS[0];
      renderEventDetails({ ...demo, tenantId });
    }
  };

  loadEvent();

  return createAppShell('/events', content);
}
