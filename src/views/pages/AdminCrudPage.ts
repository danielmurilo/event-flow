import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';
import { createAppShell } from '@/views/components/AppShell';
import { ICONS } from '@/views/icons/icons';
import { categoryRepository, ICategoryRepository } from '@/models/repositories/categoryRepository';
import { ingredientRepository, IIngredientRepository } from '@/models/repositories/ingredientRepository';
import { technicalSheetRepository, ITechnicalSheetRepository } from '@/models/repositories/technicalSheetRepository';
import { dishRepository, IDishRepository } from '@/models/repositories/dishRepository';
import {
  DishCategory,
  Ingredient,
  TechnicalSheetIngredientItem,
  IngredientSourceType,
  PreparationTechnicalSheet,
  Dish
} from '@/models/types/recipe.types';
import {
  calculateCorrectionFactor,
  calculateItemCost,
  hasCycle,
  getAvailableSubproducts,
  propagateSubproductCostUpdate
} from '@/services/recipe/technicalSheetService';

export const INITIAL_CATEGORIES: DishCategory[] = [
  { id: 'cat-pre', tenantId: 'default-tenant', name: 'Pré-preparos & Bases de Produção', is_pre_preparation: true },
  { id: 'cat-01', tenantId: 'default-tenant', name: 'Entradas & Finger Foods' },
  { id: 'cat-02', tenantId: 'default-tenant', name: 'Pratos Principais (Carnes Nobres)' },
  { id: 'cat-03', tenantId: 'default-tenant', name: 'Acompanhamentos & Risotos' },
  { id: 'cat-04', tenantId: 'default-tenant', name: 'Sobremesas Finas' },
  { id: 'cat-05', tenantId: 'default-tenant', name: 'Bebidas & Coquetelaria' }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-01', tenantId: 'default-tenant', name: 'Filé Mignon Limpo', brand: 'Friboi Black / Swift', measurement_unity: 'kg', cost: 78.50, total_yield_homemade_measure: '1 bife médio (180g)' },
  { id: 'ing-02', tenantId: 'default-tenant', name: 'Arroz Arbóreo', brand: 'La Pastina', measurement_unity: 'kg', cost: 24.90, total_yield_homemade_measure: '1 xícara (200g)' },
  { id: 'ing-03', tenantId: 'default-tenant', name: 'Queijo Parmesão Grana Padano', brand: 'Importado', measurement_unity: 'kg', cost: 145.00, total_yield_homemade_measure: '1 colher sopa (20g)' },
  { id: 'ing-04', tenantId: 'default-tenant', name: 'Creme de Leite Fresco 35%', brand: 'Xandô', measurement_unity: 'l', cost: 32.00, total_yield_homemade_measure: '1 xícara (240ml)' },
  { id: 'ing-05', tenantId: 'default-tenant', name: 'Azeite de Oliva Extra Virgem', brand: 'Gallo / Andorinha', measurement_unity: 'l', cost: 48.00, total_yield_homemade_measure: '1 colher sopa (15ml)' }
];

export const INITIAL_TECHNICAL_SHEETS: PreparationTechnicalSheet[] = [
  {
    id: 'ft-001',
    tenantId: 'default-tenant',
    dish_category_id: 'cat-02',
    name: 'Filé Mignon ao Molho Roti',
    ingredients: [
      { ingredient_id: 'ing-01', gross_weight: 2.0, net_weight: 1.6, homemade_measure: '10 medalhões (160g)', cost: 157.00 },
      { ingredient_id: 'ing-05', gross_weight: 0.15, net_weight: 0.15, homemade_measure: '10 colheres sopa', cost: 7.20 },
      { ingredient_id: 'ing-03', gross_weight: 0.14, net_weight: 0.137, homemade_measure: '7 colheres sopa', cost: 20.30 }
    ],
    preparation_method: ['Selar os medalhões em fogo alto', 'Reduzir o caldo de ossos para o molho roti', 'Finalizar com manteiga gelada'],
    total_yield: 10,
    total_yield_measurement_unity: 'porções',
    total_yield_weight: 2.2,
    total_yield_cost: 184.50
  },
  {
    id: 'ft-002',
    tenantId: 'default-tenant',
    dish_category_id: 'cat-03',
    name: 'Risoto de Funghi Secchi',
    ingredients: [
      { ingredient_id: 'ing-02', gross_weight: 1.5, net_weight: 1.5, homemade_measure: '7.5 xícaras', cost: 37.35 },
      { ingredient_id: 'ing-03', gross_weight: 0.3, net_weight: 0.294, homemade_measure: '15 colheres sopa', cost: 43.50 },
      { ingredient_id: 'ing-05', gross_weight: 0.12, net_weight: 0.12, homemade_measure: '8 colheres sopa', cost: 5.76 },
      { ingredient_id: 'ing-04', gross_weight: 0.31, net_weight: 0.31, homemade_measure: '1.3 xícaras', cost: 9.92 }
    ],
    preparation_method: ['Hidratar o funghi em água morna', 'Refogar o arroz arbóreo e deglaçar com vinho branco', 'Adicionar caldo aos poucos até ponto al dente'],
    total_yield: 15,
    total_yield_measurement_unity: 'porções',
    total_yield_weight: 3.0,
    total_yield_cost: 96.53
  },
  {
    id: 'ft-003',
    tenantId: 'default-tenant',
    dish_category_id: 'cat-01',
    name: 'Bruschetta Tradizionale Caprese',
    ingredients: [
      { ingredient_id: 'ing-05', gross_weight: 0.25, net_weight: 0.25, homemade_measure: '16 colheres sopa', cost: 12.00 },
      { ingredient_id: 'ing-03', gross_weight: 0.35, net_weight: 0.343, homemade_measure: '17 colheres sopa', cost: 50.75 }
    ],
    preparation_method: ['Tostar fatias de pão italiano com azeite', 'Cobrir com tomates picados, manjericão e mozzarella di bufala'],
    total_yield: 40,
    total_yield_measurement_unity: 'unid',
    total_yield_weight: 1.8,
    total_yield_cost: 62.75
  }
];

export const INITIAL_DISHES: Dish[] = [
  {
    id: 'pr-10',
    tenantId: 'default-tenant',
    name: 'Medalhão de Mignon com Risoto de Funghi',
    preparation_technical_sheet_ids: ['ft-001', 'ft-002'],
    extra_ingredients: [{ ingredient_id: 'Crisp de Alho-poró', quantity: 100, unit: 'g' }]
  },
  {
    id: 'pr-11',
    tenantId: 'default-tenant',
    name: 'Bruschetta Tradizionale Caprese com Brotos',
    preparation_technical_sheet_ids: ['ft-003'],
    extra_ingredients: [{ ingredient_id: 'Brotos e Flores Comestíveis', quantity: 30, unit: 'g' }]
  }
];

export function showToast(message: string, isError = false): void {
  const existing = document.querySelector('.toast-feedback');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = `toast-feedback ${isError ? 'error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

export function parseNumber(val: string | number | undefined, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const normalized = String(val).replace(',', '.').trim();
  const num = parseFloat(normalized);
  return isNaN(num) ? fallback : num;
}

export function createAdminCrudPage(
  path: string,
  repos?: {
    category?: ICategoryRepository;
    ingredient?: IIngredientRepository;
    techSheet?: ITechnicalSheetRepository;
    dish?: IDishRepository;
  }
): HTMLElement {
  const content = document.createElement('div');
  content.className = 'admin-crud-view';

  const catRepo = repos?.category || categoryRepository;
  const ingRepo = repos?.ingredient || ingredientRepository;
  const sheetRepo = repos?.techSheet || technicalSheetRepository;
  const dishRepo = repos?.dish || dishRepository;

  const user = authController.getState().user;
  const userRole = user?.role || 'operator';
  const tenantId = user?.tenantId || 'buffet-principal';

  // 1. ROTA ESPECIAL: GESTÃO DE USUÁRIOS COM RESTRIÇÃO
  if (path === '/users') {
    if (userRole !== 'admin' && userRole !== 'manager') {
      content.innerHTML = `
        <div class="restricted-access-card card-elevation">
          <div class="restricted-icon">${ICONS.lock}</div>
          <h2>Acesso Restrito</h2>
          <p>
            A página de <strong>Gestão de Utilizadores</strong> é restrita a administradores e gerentes da empresa
            (<strong>${tenantId}</strong>).
          </p>
          <p class="role-notice">O seu nível de acesso atual é: <span class="user-role-badge role-operator">Operador</span>.</p>
          <div class="mt-4">
            <button type="button" id="btn-restricted-back" class="btn btn-primary">Voltar para Eventos</button>
          </div>
        </div>
      `;

      content.querySelector('#btn-restricted-back')?.addEventListener('click', () => {
        router.navigate('/events');
      });

      return createAppShell(path, content);
    }

    content.innerHTML = `
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Gestão de Utilizadores</h1>
          <p class="page-subtitle">Controle de colaboradores e níveis de permissão da empresa <strong>${tenantId}</strong>.</p>
        </div>
        <button type="button" class="btn btn-primary" id="btn-invite-user">
          <span class="btn-icon">${ICONS.plus}</span> Convidar Colaborador
        </button>
      </div>

      <section class="table-container-card">
        <div class="table-responsive">
          <table class="events-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Nível de Acesso (Role)</th>
                <th>Status</th>
                <th>Empresa (Tenant)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="Nome"><strong>${user?.displayName || 'Usuário Atual'}</strong> <small>(Você)</small></td>
                <td data-label="E-mail">${user?.email}</td>
                <td data-label="Nível de acesso"><span class="user-role-badge role-${userRole}">${userRole.toUpperCase()}</span></td>
                <td data-label="Status"><span class="badge-confirmed">Ativo</span></td>
                <td data-label="Empresa"><code>${tenantId}</code></td>
                <td data-label="Ações"><span class="text-muted">Sessão Atual</span></td>
              </tr>
              <tr>
                <td data-label="Nome"><strong>Marcelo Duarte</strong></td>
                <td data-label="E-mail">chefe.marcelo@buffet.com</td>
                <td data-label="Nível de acesso"><span class="user-role-badge role-manager">MANAGER</span></td>
                <td data-label="Status"><span class="badge-confirmed">Ativo</span></td>
                <td data-label="Empresa"><code>${tenantId}</code></td>
                <td data-label="Ações"><button type="button" class="btn btn-ghost btn-sm">Editar</button></td>
              </tr>
              <tr>
                <td data-label="Nome"><strong>Carlos Silva</strong></td>
                <td data-label="E-mail">carlos.logistica@buffet.com</td>
                <td data-label="Nível de acesso"><span class="user-role-badge role-operator">OPERATOR</span></td>
                <td data-label="Status"><span class="badge-confirmed">Ativo</span></td>
                <td data-label="Empresa"><code>${tenantId}</code></td>
                <td data-label="Ações"><button type="button" class="btn btn-ghost btn-sm">Editar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;

    return createAppShell(path, content);
  }

  // 2. CRUD REAL CONECTADO AO FIRESTORE PARA CATEGORIAS, INGREDIENTES, FICHAS TÉCNICAS E PRATOS
  const isCategory = path === '/categories';
  const isIngredient = path === '/ingredients';
  const isTechSheet = path === '/technical-sheets';
  const isDish = path === '/dishes';

  const titles: Record<string, { title: string; subtitle: string; singular: string; feminine?: boolean }> = {
    '/categories': {
      title: 'Categorias de Pratos',
      subtitle: 'Classificação gastronómica vinculada a fichas técnicas e cardápios no Firestore.',
      singular: 'Categoria de Prato',
      feminine: true
    },
    '/ingredients': {
      title: 'Ingredientes & Insumos',
      subtitle: 'Catálogo de insumos com controle de Fator de Correção (FC) e custos unitários.',
      singular: 'Ingrediente',
      feminine: false
    },
    '/technical-sheets': {
      title: 'Fichas Técnicas de Preparação',
      subtitle: 'Fichas de rendimento, modo de preparo e custos operacionais.',
      singular: 'Ficha Técnica de Preparação',
      feminine: true
    },
    '/dishes': {
      title: 'Catálogo de Pratos',
      subtitle: 'Composições servidas aos convidados formadas por fichas técnicas e insumos extras.',
      singular: 'Prato',
      feminine: false
    },
    '/services': {
      title: 'Serviços de Eventos',
      subtitle: 'Modelos de serviço (Welcome Drink, Coquetel, Jantar, Carrinhos ao Vivo).',
      singular: 'Serviço de Evento',
      feminine: false
    },
    '/support-materials': {
      title: 'Materiais de Apoio & Logística',
      subtitle: 'Controle de caixas secas, equipamentos térmicos, EPIs e elétrica.',
      singular: 'Material de Apoio',
      feminine: false
    }
  };

  const meta = titles[path] || {
    title: 'Módulo Administrativo',
    subtitle: 'Gestão operacional de buffet.',
    singular: 'Registro',
    feminine: false
  };
  const hasInlineAdd = isIngredient || isTechSheet;

  content.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">${meta.title}</h1>
        <p class="page-subtitle">${meta.subtitle}</p>
      </div>
      ${!hasInlineAdd ? `
        <button type="button" class="btn btn-primary" id="btn-open-create-modal">
          <span class="btn-icon">${ICONS.plus}</span> Novo Registro
        </button>
      ` : ''}
    </div>

    <!-- Barra de busca -->
    <section class="filters-card">
      <div class="search-row-flex">
        <div class="search-input-wrapper">
          <span class="search-icon">${ICONS.search}</span>
          <input
            type="search"
            id="input-filter-items"
            class="form-control search-input"
            placeholder="Filtrar registros..."
            aria-label="Filtrar registros"
          />
        </div>
        ${hasInlineAdd ? `
          <button type="button" class="btn btn-primary btn-sm btn-inline-add" id="btn-open-create-modal">
            <span class="btn-icon">${ICONS.plus}</span> Novo Registro
          </button>
        ` : ''}
      </div>
    </section>

    <!-- Tabela de Registros com Loading State -->
    <section class="table-container-card">
      <div class="loading-state" id="crud-loading">
        <div class="spinner"></div>
        <p>Consultando dados no Cloud Firestore...</p>
      </div>
      <div class="table-responsive" id="crud-table-area" style="display: none;">
        <table class="events-table">
          <thead id="crud-table-head"></thead>
          <tbody id="crud-table-body"></tbody>
        </table>
      </div>
      <div id="crud-empty" class="empty-state" style="display: none;">
        <div class="empty-icon">${ICONS.calendar}</div>
        <h3>Nenhum registro encontrado</h3>
        <p>Clique em "+ Novo Registro" para adicionar o primeiro item.</p>
      </div>
    </section>

    <!-- MODAL DE CRIAÇÃO / EDIÇÃO -->
    <div id="crud-modal-overlay" class="crud-modal-backdrop" aria-hidden="true">
      <div class="crud-modal" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
        <div class="crud-modal-header">
          <h2 id="modal-headline" class="crud-modal-title">Novo Registro</h2>
          <button type="button" id="btn-close-modal" class="icon-button" aria-label="Fechar janela">
            ${ICONS.close}
          </button>
        </div>
        <form id="crud-form">
          <div class="crud-modal-body" id="modal-form-fields"></div>
          <div class="crud-modal-footer">
            <button type="button" id="btn-cancel-modal" class="btn btn-outline">Cancelar</button>
            <button type="submit" id="btn-save-record" class="btn btn-primary">Salvar no Firestore</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL RÁPIDO PARA INSERIR NOVO INGREDIENTE DIRETAMENTE NA FICHA TÉCNICA -->
    <div id="quick-ing-modal-overlay" class="crud-modal-backdrop quick-modal-backdrop" aria-hidden="true">
      <div class="crud-modal" style="max-width: 520px;" role="dialog" aria-modal="true" aria-labelledby="quick-ing-headline">
        <div class="crud-modal-header">
          <h3 id="quick-ing-headline" class="crud-modal-title">Novo Ingrediente no Catálogo</h3>
          <button type="button" id="btn-close-quick-ing" class="icon-button" aria-label="Fechar janela">
            ${ICONS.close}
          </button>
        </div>
        <form id="quick-ing-form">
          <div class="crud-modal-body">
            <div class="form-group">
              <label for="quick-ing-name" class="form-label">Nome do Ingrediente *</label>
              <input type="text" id="quick-ing-name" class="form-control" required placeholder="Ex: Queijo Brie, Trufa Negra..." />
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="quick-ing-brand" class="form-label">Marca / Fornecedor</label>
                <input type="text" id="quick-ing-brand" class="form-control" placeholder="Ex: Tirolez, Scala..." />
              </div>
              <div class="form-group">
                <label for="quick-ing-unit" class="form-label">Unidade de Medida *</label>
                <select id="quick-ing-unit" class="form-control" required>
                  <option value="kg">kg (Quilograma)</option>
                  <option value="g">g (Grama)</option>
                  <option value="l">l (Litro)</option>
                  <option value="ml">ml (Mililitro)</option>
                  <option value="unid">unid (Unidade)</option>
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="quick-ing-cost" class="form-label">Custo Unitário (R$) *</label>
                <input type="number" step="0.01" min="0" id="quick-ing-cost" class="form-control" required placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="quick-ing-homemade" class="form-label">Medida Caseira de Referência</label>
                <input type="text" id="quick-ing-homemade" class="form-control" placeholder="Ex: 1 xícara (200g), 1 colher sopa..." />
              </div>
            </div>
          </div>
          <div class="crud-modal-footer">
            <button type="button" id="btn-cancel-quick-ing" class="btn btn-outline">Cancelar</button>
            <button type="submit" id="btn-save-quick-ing" class="btn btn-primary">Salvar e Usar na Ficha</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const loadingEl = content.querySelector<HTMLElement>('#crud-loading')!;
  const tableArea = content.querySelector<HTMLElement>('#crud-table-area')!;
  const emptyEl = content.querySelector<HTMLElement>('#crud-empty')!;
  const thead = content.querySelector<HTMLTableSectionElement>('#crud-table-head')!;
  const tbody = content.querySelector<HTMLTableSectionElement>('#crud-table-body')!;
  const filterInput = content.querySelector<HTMLInputElement>('#input-filter-items')!;
  const btnOpenModal = content.querySelector<HTMLButtonElement>('#btn-open-create-modal')!;

  const modalOverlay = content.querySelector<HTMLElement>('#crud-modal-overlay')!;
  const modalTitle = content.querySelector<HTMLElement>('#modal-headline')!;
  const modalFields = content.querySelector<HTMLElement>('#modal-form-fields')!;
  const btnCloseModal = content.querySelector<HTMLButtonElement>('#btn-close-modal')!;
  const btnCancelModal = content.querySelector<HTMLButtonElement>('#btn-cancel-modal')!;
  const form = content.querySelector<HTMLFormElement>('#crud-form')!;
  const btnSubmit = content.querySelector<HTMLButtonElement>('#btn-save-record')!;

  // Elementos do Modal Rápido de Ingrediente
  const quickIngOverlay = content.querySelector<HTMLElement>('#quick-ing-modal-overlay')!;
  const quickIngForm = content.querySelector<HTMLFormElement>('#quick-ing-form')!;
  const btnCloseQuickIng = content.querySelector<HTMLButtonElement>('#btn-close-quick-ing')!;
  const btnCancelQuickIng = content.querySelector<HTMLButtonElement>('#btn-cancel-quick-ing')!;
  const quickIngNameInput = content.querySelector<HTMLInputElement>('#quick-ing-name')!;
  const quickIngBrandInput = content.querySelector<HTMLInputElement>('#quick-ing-brand')!;
  const quickIngUnitSelect = content.querySelector<HTMLSelectElement>('#quick-ing-unit')!;
  const quickIngCostInput = content.querySelector<HTMLInputElement>('#quick-ing-cost')!;
  const quickIngHomemadeInput = content.querySelector<HTMLInputElement>('#quick-ing-homemade')!;
  const btnSaveQuickIng = content.querySelector<HTMLButtonElement>('#btn-save-quick-ing')!;

  let activeQuickIngRowIndex: number | null = null;

  const openQuickIngModal = (rowIndex: number | null, initialName = '') => {
    activeQuickIngRowIndex = rowIndex;
    quickIngNameInput.value = initialName;
    quickIngBrandInput.value = '';
    quickIngUnitSelect.value = 'kg';
    quickIngCostInput.value = '';
    quickIngHomemadeInput.value = '';
    quickIngOverlay.classList.add('is-open');
    quickIngOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => quickIngNameInput.focus(), 60);
  };

  const closeQuickIngModal = () => {
    quickIngOverlay.classList.remove('is-open');
    quickIngOverlay.setAttribute('aria-hidden', 'true');
    activeQuickIngRowIndex = null;
    quickIngForm.reset();
  };

  btnCloseQuickIng.addEventListener('click', closeQuickIngModal);
  btnCancelQuickIng.addEventListener('click', closeQuickIngModal);
  quickIngOverlay.addEventListener('click', (e) => {
    if (e.target === quickIngOverlay) closeQuickIngModal();
  });

  let currentItems: any[] = [];
  let editingId: string | null = null;
  let cachedCategories: DishCategory[] = [];
  let cachedIngredients: Ingredient[] = [];
  let cachedTechSheets: PreparationTechnicalSheet[] = [];
  let modalSheetIngredients: TechnicalSheetIngredientItem[] = [];
  let refreshSheetIngredientsFn: (() => void) | null = null;
  let updateCalculatedCostFn: (() => void) | null = null;

  quickIngForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSaveQuickIng.disabled = true;
    btnSaveQuickIng.textContent = 'Salvando no Firestore...';
    try {
      const name = quickIngNameInput.value.trim();
      if (!name) throw new Error('Nome do ingrediente é obrigatório.');

      const newId = `ing-${Date.now().toString(36)}`;
      const newIng: Ingredient = {
        id: newId,
        tenantId,
        name,
        brand: quickIngBrandInput.value.trim(),
        measurement_unity: quickIngUnitSelect.value,
        cost: parseNumber(quickIngCostInput.value, 0),
        total_yield_homemade_measure: quickIngHomemadeInput.value.trim()
      };

      await ingRepo.save(newIng);
      cachedIngredients.push(newIng);

      if (activeQuickIngRowIndex !== null && modalSheetIngredients[activeQuickIngRowIndex]) {
        const net = modalSheetIngredients[activeQuickIngRowIndex].net_weight || 1.0;
        const gross = modalSheetIngredients[activeQuickIngRowIndex].gross_weight || net;
        const fc = net > 0 ? Number((gross / net).toFixed(2)) : 1.0;
        const cost = Number((gross * newIng.cost).toFixed(2));
        modalSheetIngredients[activeQuickIngRowIndex].source_type = 'raw_material';
        modalSheetIngredients[activeQuickIngRowIndex].source_id = newId;
        modalSheetIngredients[activeQuickIngRowIndex].ingredient_id = newId;
        modalSheetIngredients[activeQuickIngRowIndex].name = newIng.name;
        modalSheetIngredients[activeQuickIngRowIndex].brand_or_tag = newIng.brand || '';
        modalSheetIngredients[activeQuickIngRowIndex].measurement_unity = newIng.measurement_unity;
        modalSheetIngredients[activeQuickIngRowIndex].unit_cost = newIng.cost;
        modalSheetIngredients[activeQuickIngRowIndex].net_weight = net;
        modalSheetIngredients[activeQuickIngRowIndex].gross_weight = gross;
        modalSheetIngredients[activeQuickIngRowIndex].correction_factor = fc;
        modalSheetIngredients[activeQuickIngRowIndex].calculated_cost = cost;
        modalSheetIngredients[activeQuickIngRowIndex].cost = cost;
      } else if (isTechSheet) {
        const net = 1.0;
        const gross = 1.0;
        const cost = Number((gross * newIng.cost).toFixed(2));
        modalSheetIngredients.push({
          id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          source_type: 'raw_material',
          source_id: newId,
          ingredient_id: newId,
          name: newIng.name,
          brand_or_tag: newIng.brand || '',
          measurement_unity: newIng.measurement_unity,
          net_weight: net,
          gross_weight: gross,
          correction_factor: 1.0,
          unit_cost: newIng.cost,
          calculated_cost: cost,
          homemade_measure: '',
          cost
        });
      }

      closeQuickIngModal();
      if (refreshSheetIngredientsFn) refreshSheetIngredientsFn();
      if (updateCalculatedCostFn) updateCalculatedCostFn();
      if (isIngredient) {
        loadData();
      }

      showToast(`✓ Insumo "${newIng.name}" cadastrado e adicionado à receita!`);
    } catch (err: any) {
      showToast(`Erro ao cadastrar ingrediente: ${err.message}`, true);
    } finally {
      btnSaveQuickIng.disabled = false;
      btnSaveQuickIng.textContent = 'Salvar e Usar na Ficha';
    }
  });

  const openModal = () => {
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    modalOverlay.querySelector('.crud-modal')?.classList.remove('crud-modal-lg');
    editingId = null;
    modalSheetIngredients = [];
    refreshSheetIngredientsFn = null;
    updateCalculatedCostFn = null;
    form.reset();
  };

  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // RENDERIZADOR DE CAMPOS DO FORMULÁRIO BASEADO NA ENTIDADE
  const setupFormFields = (itemToEdit?: any) => {
    modalOverlay.querySelector('.crud-modal')?.classList.remove('crud-modal-lg');
    const prefixNew = meta.feminine ? 'Nova' : 'Novo';
    modalTitle.textContent = itemToEdit ? `Editar ${meta.singular}` : `${prefixNew} ${meta.singular}`;

    if (isCategory) {
      modalFields.innerHTML = `
        <div class="form-group">
          <label for="input-cat-name" class="form-label">Nome da Categoria *</label>
          <input
            type="text"
            id="input-cat-name"
            class="form-control"
            required
            placeholder="Ex: Entradas, Pratos Principais, Risotos..."
            value="${itemToEdit?.name || ''}"
          />
        </div>
      `;
    } else if (isIngredient) {
      modalFields.innerHTML = `
        <div class="form-group">
          <label for="input-ing-name" class="form-label">Nome do Ingrediente *</label>
          <input
            type="text"
            id="input-ing-name"
            class="form-control"
            required
            placeholder="Ex: Filé Mignon Limpo, Arroz Arbóreo..."
            value="${itemToEdit?.name || ''}"
          />
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="input-ing-brand" class="form-label">Marca Padrão</label>
            <input
              type="text"
              id="input-ing-brand"
              class="form-control"
              placeholder="Ex: Swift, La Pastina..."
              value="${itemToEdit?.brand || ''}"
            />
          </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="select-ing-unit" class="form-label">Unidade de Medida *</label>
            <select id="select-ing-unit" class="form-control" required>
              <option value="kg" ${itemToEdit?.measurement_unity === 'kg' ? 'selected' : ''}>kg (Quilograma)</option>
              <option value="g" ${itemToEdit?.measurement_unity === 'g' ? 'selected' : ''}>g (Grama)</option>
              <option value="l" ${itemToEdit?.measurement_unity === 'l' ? 'selected' : ''}>l (Litro)</option>
              <option value="ml" ${itemToEdit?.measurement_unity === 'ml' ? 'selected' : ''}>ml (Mililitro)</option>
              <option value="unid" ${itemToEdit?.measurement_unity === 'unid' ? 'selected' : ''}>unid (Unidade)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="input-ing-cost" class="form-label">Custo Unitário (R$) *</label>
            <input
              type="number"
              step="0.01"
              id="input-ing-cost"
              class="form-control"
              required
              placeholder="0.00"
              value="${itemToEdit?.cost !== undefined ? itemToEdit.cost : ''}"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="input-ing-homemade" class="form-label">Rendimento em Medida Caseira</label>
          <input
            type="text"
            id="input-ing-homemade"
            class="form-control"
            placeholder="Ex: 1 xícara de chá (200g), 1 bife médio..."
            value="${itemToEdit?.total_yield_homemade_measure || ''}"
          />
        </div>
      `;
    } else if (isTechSheet) {
      modalOverlay.querySelector('.crud-modal')?.classList.add('crud-modal-lg');
      if (cachedTechSheets.length === 0 && currentItems.length > 0) {
        cachedTechSheets = [...currentItems];
      }

      const mapItemToModel = (it: any): TechnicalSheetIngredientItem => {
        const source_id = it.source_id || it.ingredient_id || it.ingredientId || it.id || '';
        const isSub = it.source_type === 'subproduct';
        let name = it.name || '';
        let brandOrTag = it.brand_or_tag || (isSub ? 'Subproduto' : '');
        let unit = it.measurement_unity || it.unit;
        let unit_cost = Number(it.unit_cost) || 0;

        if (isSub) {
          const sub = cachedTechSheets.find(s => s.id === source_id);
          if (sub) {
            name = name || sub.name;
            brandOrTag = 'Subproduto';
            unit = unit || sub.total_yield_measurement_unity;
            unit_cost = unit_cost || (sub.cost_per_serving !== undefined ? sub.cost_per_serving : (sub.total_yield > 0 ? sub.total_yield_cost / sub.total_yield : 0));
          }
        } else {
          const ing = cachedIngredients.find(i => i.id === source_id) || INITIAL_INGREDIENTS.find(i => i.id === source_id);
          if (ing) {
            name = name || ing.name;
            brandOrTag = brandOrTag || ing.brand || '';
            unit = unit || ing.measurement_unity;
            unit_cost = unit_cost || ing.cost;
          }
        }

        const gross = parseNumber(it.gross_weight ?? it.grossWeight, 0);
        const net = parseNumber(it.net_weight ?? it.netWeight, 0);
        const fc = (net > 0 && gross > 0) ? calculateCorrectionFactor(gross, net) : (Number(it.correction_factor) || 1.0);
        const calcCost = it.calculated_cost !== undefined
          ? parseNumber(it.calculated_cost, 0)
          : (it.cost !== undefined ? parseNumber(it.cost, 0) : calculateItemCost(gross, unit_cost));

        return {
          id: it.id || `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          source_type: isSub ? 'subproduct' : 'raw_material',
          source_id,
          ingredient_id: source_id,
          name,
          brand_or_tag: brandOrTag,
          measurement_unity: (unit as any) || 'kg',
          gross_weight: gross,
          net_weight: net,
          correction_factor: fc,
          unit_cost,
          calculated_cost: calcCost,
          cost: calcCost,
          homemade_measure: it.homemade_measure || it.homemadeMeasure || ''
        };
      };

      let rawIngs = itemToEdit?.ingredients;
      if (typeof rawIngs === 'string') {
        try { rawIngs = JSON.parse(rawIngs); } catch {}
      }
      if (rawIngs && typeof rawIngs === 'object' && !Array.isArray(rawIngs)) {
        rawIngs = Object.values(rawIngs);
      }
      if (Array.isArray(rawIngs) && rawIngs.length > 0) {
        modalSheetIngredients = rawIngs.map(mapItemToModel);
      } else if (itemToEdit) {
        // Se a ficha técnica veio sem ingredientes (por exemplo, registros iniciais salvos no Firestore anteriormente)
        const seedMatch = INITIAL_TECHNICAL_SHEETS.find(
          s => s.id === itemToEdit.id || s.name.toLowerCase() === (itemToEdit.name || '').toLowerCase()
        );
        if (seedMatch && seedMatch.ingredients && seedMatch.ingredients.length > 0) {
          modalSheetIngredients = seedMatch.ingredients.map(mapItemToModel);
        } else {
          modalSheetIngredients = [];
        }
      } else {
        modalSheetIngredients = [];
      }

      modalFields.innerHTML = `
        <div class="form-group">
          <label for="input-sheet-name" class="form-label">Nome da Preparação *</label>
          <input
            type="text"
            id="input-sheet-name"
            class="form-control"
            required
            placeholder="Ex: Filé Mignon ao Molho Roti..."
            value="${itemToEdit?.name || ''}"
          />
        </div>
        <div class="form-group">
          <label for="select-sheet-cat" class="form-label">Categoria de Prato *</label>
          <select id="select-sheet-cat" class="form-control" required>
            <option value="">Selecione uma categoria...</option>
            ${cachedCategories.map(c => `
              <option value="${c.id}" ${itemToEdit?.dish_category_id === c.id ? 'selected' : ''}>
                ${c.name}${c.is_pre_preparation ? ' (Pré-preparos / Bases)' : ''}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-top: -6px;">
          <div style="background: var(--color-surface-container); padding: 12px 14px; border-radius: var(--md-sys-shape-corner-medium); border: 1px solid var(--color-outline-variant);">
            <label for="check-sheet-is-pre-prep" style="font-weight: 600; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-bottom: 0;">
              <input
                type="checkbox"
                id="check-sheet-is-pre-prep"
                ${itemToEdit?.is_pre_preparation ? 'checked' : ''}
                style="width: 16px; height: 16px; cursor: pointer;"
              />
              Pré-preparo / Subproduto (Base de Produção)
            </label>
            <span class="text-muted" style="font-size: 0.78rem; display: block; margin-top: 4px; margin-left: 24px;">
              Permite que esta receita seja utilizada como insumo ou componente em outras fichas técnicas. O código do subproduto (ex: SB ${itemToEdit?.name || '...'}) é gerado automaticamente ao salvar.
            </span>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="input-sheet-yield" class="form-label">Rendimento Total *</label>
            <input
              type="number"
              id="input-sheet-yield"
              class="form-control"
              required
              min="1"
              value="${itemToEdit?.total_yield || '10'}"
            />
          </div>
          <div class="form-group">
            <label for="input-sheet-yield-unit" class="form-label">Unidade do Rendimento *</label>
            <input
              type="text"
              id="input-sheet-yield-unit"
              class="form-control"
              required
              placeholder="Ex: porções, unid, kg"
              value="${itemToEdit?.total_yield_measurement_unity || 'porções'}"
            />
          </div>
        </div>

        <!-- Seção de Ingredientes da Ficha Técnica -->
        <div class="sheet-ingredients-section">
          <div class="sheet-ingredients-header">
            <div>
              <h4>Ingredientes & Insumos da Receita *</h4>
              <p class="text-muted" style="font-size: 0.8rem; margin: 0;">
                Busque pelo nome do ingrediente ou subproduto cadastrado, ou cadastre novos insumos diretamente.
              </p>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" id="btn-header-quick-add-ing" class="btn btn-outline btn-sm">
                <span class="btn-icon">${ICONS.plus}</span> Novo Insumo no Catálogo
              </button>
              <button type="button" id="btn-add-sheet-ingredient" class="btn btn-primary btn-sm">
                <span class="btn-icon">${ICONS.plus}</span> Adicionar Ingrediente / Subproduto
              </button>
            </div>
          </div>

          <div id="sheet-ingredients-container" class="sheet-ingredients-list"></div>

          <div class="sheet-cost-summary-bar">
            <div class="summary-col">
              <span class="summary-label">Insumos na Ficha:</span>
              <span id="summary-ing-count" class="summary-val"><strong>0</strong> itens</span>
            </div>
            <div class="summary-col">
              <span class="summary-label">Custo por Porção / Unid:</span>
              <span id="summary-cost-per-portion" class="summary-val"><strong>R$ 0,00</strong></span>
            </div>
            <div class="summary-col">
              <span class="summary-label">Custo Total Calculado:</span>
              <span id="summary-total-cost" class="summary-val highlight"><strong>R$ 0,00</strong></span>
            </div>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label for="input-sheet-weight" class="form-label">Peso Final Total (kg)</label>
            <input
              type="number"
              step="0.001"
              id="input-sheet-weight"
              class="form-control"
              placeholder="Ex: 2.2"
              value="${itemToEdit?.total_yield_weight || ''}"
            />
          </div>
          <div class="form-group">
            <label for="input-sheet-cost" class="form-label">Custo Total Calculado (R$)</label>
            <input
              type="number"
              step="0.01"
              id="input-sheet-cost"
              class="form-control"
              readonly
              style="background: var(--color-surface-container); font-weight: 600;"
              value="${itemToEdit?.total_yield_cost ? itemToEdit.total_yield_cost.toFixed(2) : '0.00'}"
              title="Calculado automaticamente pela soma dos custos dos ingredientes"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="textarea-sheet-method" class="form-label">Modo de Preparo (um passo por linha)</label>
          <textarea
            id="textarea-sheet-method"
            class="form-control"
            rows="3"
            placeholder="1. Selar os ingredientes...&#10;2. Cozinhar sob pressão...&#10;3. Finalizar e empratar."
          >${itemToEdit?.preparation_method ? itemToEdit.preparation_method.join('\n') : ''}</textarea>
        </div>
      `;

      // Automação ao trocar categoria para Pré-preparos
      const catSelect = modalFields.querySelector<HTMLSelectElement>('#select-sheet-cat');
      const isPrePrepCheck = modalFields.querySelector<HTMLInputElement>('#check-sheet-is-pre-prep');

      catSelect?.addEventListener('change', () => {
        const selectedCat = cachedCategories.find(c => c.id === catSelect.value);
        const isPre = Boolean(
          selectedCat?.is_pre_preparation ||
          selectedCat?.id === 'cat-pre' ||
          selectedCat?.name.toLowerCase().includes('pré-preparo') ||
          selectedCat?.name.toLowerCase().includes('subproduto')
        );
        if (isPre && isPrePrepCheck) {
          isPrePrepCheck.checked = true;
        }
      });

      const updateCalculatedCost = () => {
        const totalCost = Number(modalSheetIngredients.reduce((sum, item) => sum + (item.calculated_cost || item.cost || 0), 0).toFixed(2));
        const totalWeight = Number(modalSheetIngredients.reduce((sum, item) => sum + (item.gross_weight || item.net_weight || 0), 0).toFixed(3));

        const costInput = modalFields.querySelector<HTMLInputElement>('#input-sheet-cost');
        if (costInput) {
          costInput.value = totalCost.toFixed(2);
        }

        const weightInput = modalFields.querySelector<HTMLInputElement>('#input-sheet-weight');
        if (weightInput && (!weightInput.value || weightInput.value === '0')) {
          if (totalWeight > 0) weightInput.value = totalWeight.toFixed(3);
        }

        const yieldInput = modalFields.querySelector<HTMLInputElement>('#input-sheet-yield');
        const yieldVal = yieldInput ? parseNumber(yieldInput.value, 1) : 1;
        const costPerPortion = yieldVal > 0 ? (totalCost / yieldVal) : 0;

        const summaryCount = modalFields.querySelector<HTMLElement>('#summary-ing-count');
        const summaryPerPortion = modalFields.querySelector<HTMLElement>('#summary-cost-per-portion');
        const summaryTotal = modalFields.querySelector<HTMLElement>('#summary-total-cost');

        if (summaryCount) {
          summaryCount.innerHTML = `<strong>${modalSheetIngredients.length}</strong> ${modalSheetIngredients.length === 1 ? 'item' : 'itens'}`;
        }
        if (summaryPerPortion) {
          summaryPerPortion.innerHTML = `<strong>R$ ${costPerPortion.toFixed(2)}</strong>`;
        }
        if (summaryTotal) {
          summaryTotal.innerHTML = `<strong>R$ ${totalCost.toFixed(2)}</strong>`;
        }
      };

      const selectItemForRow = (
        rowIndex: number,
        itemData: {
          source_type: IngredientSourceType;
          source_id: string;
          name: string;
          brand_or_tag?: string;
          measurement_unity: string;
          unit_cost: number;
        }
      ) => {
        if (!modalSheetIngredients[rowIndex]) return;
        const current = modalSheetIngredients[rowIndex];
        current.source_type = itemData.source_type;
        current.source_id = itemData.source_id;
        current.ingredient_id = itemData.source_id;
        current.name = itemData.name;
        current.brand_or_tag = itemData.brand_or_tag;
        current.measurement_unity = (itemData.measurement_unity as any) || 'kg';
        current.unit_cost = itemData.unit_cost;

        const net = current.net_weight || 0;
        const gross = current.gross_weight || 0;
        const fc = (net > 0 && gross > 0) ? calculateCorrectionFactor(gross, net) : 1.0;
        const cost = calculateItemCost(gross, itemData.unit_cost);
        current.correction_factor = fc;
        current.calculated_cost = cost;
        current.cost = cost;

        renderSheetIngredients();
        updateCalculatedCost();
      };

      const selectIngredientForRow = (rowIndex: number, identifier: string) => {
        if (!modalSheetIngredients[rowIndex]) return;
        // Tenta encontrar em matéria-prima
        const targetIng = cachedIngredients.find(x => x.id === identifier || x.name.toLowerCase() === identifier.toLowerCase())
          || INITIAL_INGREDIENTS.find(x => x.id === identifier || x.name.toLowerCase() === identifier.toLowerCase());
        if (targetIng) {
          selectItemForRow(rowIndex, {
            source_type: 'raw_material',
            source_id: targetIng.id,
            name: targetIng.name,
            brand_or_tag: targetIng.brand || '',
            measurement_unity: targetIng.measurement_unity,
            unit_cost: targetIng.cost
          });
          return;
        }

        // Tenta encontrar em subprodutos
        const targetSub = cachedTechSheets.find(s => s.id === identifier || s.name.toLowerCase() === identifier.toLowerCase() || (s.subproduct_code && s.subproduct_code.toLowerCase() === identifier.toLowerCase()));
        if (targetSub) {
          const costPerServing = targetSub.cost_per_serving !== undefined
            ? targetSub.cost_per_serving
            : (targetSub.total_yield > 0 ? targetSub.total_yield_cost / targetSub.total_yield : 0);
          selectItemForRow(rowIndex, {
            source_type: 'subproduct',
            source_id: targetSub.id,
            name: targetSub.name,
            brand_or_tag: 'Subproduto',
            measurement_unity: targetSub.total_yield_measurement_unity,
            unit_cost: costPerServing
          });
        }
      };

      const renderSheetIngredients = () => {
        const container = modalFields.querySelector<HTMLElement>('#sheet-ingredients-container');
        if (!container) return;

        if (modalSheetIngredients.length === 0) {
          container.innerHTML = `
            <div class="empty-ingredients-notice">
              <p>Nenhum ingrediente ou subproduto adicionado a esta ficha técnica.</p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" id="btn-empty-quick-add" class="btn btn-outline btn-sm">
                  <span class="btn-icon">${ICONS.plus}</span> Novo Insumo no Catálogo
                </button>
                <button type="button" id="btn-empty-add-ing" class="btn btn-primary btn-sm">
                  <span class="btn-icon">${ICONS.plus}</span> Adicionar da Lista
                </button>
              </div>
            </div>
          `;
          container.querySelector('#btn-empty-add-ing')?.addEventListener('click', addIngredientRow);
          container.querySelector('#btn-empty-quick-add')?.addEventListener('click', () => openQuickIngModal(null, ''));
          return;
        }

        container.innerHTML = modalSheetIngredients.map((item, i) => {
          const isSub = item.source_type === 'subproduct';
          const sourceId = item.source_id || item.ingredient_id || '';

          let ingDisplay = item.name || '';
          let unit = item.measurement_unity || 'kg';

          if (isSub) {
            const sub = cachedTechSheets.find(x => x.id === sourceId);
            if (sub) {
              ingDisplay = sub.name;
              unit = sub.total_yield_measurement_unity;
            }
          } else {
            const ing = cachedIngredients.find(x => x.id === sourceId)
              || cachedIngredients.find(x => x.name.toLowerCase() === sourceId.toLowerCase())
              || INITIAL_INGREDIENTS.find(x => x.id === sourceId || x.name.toLowerCase() === sourceId.toLowerCase());

            if (ing) {
              ingDisplay = `${ing.name}${ing.brand ? ` (${ing.brand})` : ''}`;
              unit = ing.measurement_unity;
              if (!cachedIngredients.some(c => c.id === ing.id)) {
                cachedIngredients.push(ing);
              }
            }
          }

          if (!ingDisplay && sourceId) {
            ingDisplay = sourceId;
          }

          const net = item.net_weight !== undefined ? item.net_weight : 0;
          const gross = item.gross_weight !== undefined ? item.gross_weight : 0;
          const fc = (net > 0 && gross > 0) ? calculateCorrectionFactor(gross, net) : (item.correction_factor || 1.0);
          const costVal = item.calculated_cost !== undefined ? item.calculated_cost : (item.cost || 0);

          return `
            <div class="sheet-ing-row" data-index="${i}">
              <div class="sheet-ing-col-name">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                  <label class="form-label-xs" style="margin-bottom: 0;">Ingrediente / Subproduto *</label>
                  ${isSub ? '<span class="badge-subproduct">Subproduto</span>' : ''}
                </div>
                <div class="searchable-combobox" data-index="${i}">
                  <input type="hidden" class="select-row-ing" data-index="${i}" value="${sourceId}" />
                  <div class="combobox-input-wrapper">
                    <input
                      type="text"
                      class="form-control form-control-sm input-ing-search"
                      data-index="${i}"
                      placeholder="Buscar insumo ou subproduto..."
                      value="${ingDisplay}"
                      autocomplete="off"
                    />
                    <button type="button" class="btn-combobox-toggle" data-index="${i}" tabindex="-1" title="Ver catálogo de insumos e subprodutos">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                  </div>
                  <div class="combobox-dropdown" data-index="${i}" style="display: none;">
                    <div class="combobox-tabs" data-index="${i}">
                      <button type="button" class="combobox-tab-btn active" data-tab="all">Todos</button>
                      <button type="button" class="combobox-tab-btn" data-tab="raw">Catálogo</button>
                      <button type="button" class="combobox-tab-btn" data-tab="sub">Subprodutos</button>
                    </div>
                    <div class="combobox-items-list"></div>
                    <div class="combobox-footer">
                      <button type="button" class="btn-combobox-quick-add" data-index="${i}">
                        <span class="btn-icon">${ICONS.plus}</span> Cadastrar Novo Ingrediente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="sheet-ing-col-gross">
                <label class="form-label-xs">Peso Bruto (${unit})</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  class="form-control form-control-sm input-row-gross"
                  data-index="${i}"
                  value="${gross > 0 ? gross : ''}"
                  placeholder="0.000"
                />
              </div>
              <div class="sheet-ing-col-net">
                <label class="form-label-xs">Peso Líq. (${unit})</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  class="form-control form-control-sm input-row-net"
                  data-index="${i}"
                  value="${net > 0 ? net : ''}"
                  placeholder="0.000"
                />
              </div>
              <div class="sheet-ing-col-fc">
                <label class="form-label-xs" title="Fator de Correção (Peso Bruto / Peso Líquido)">FC</label>
                <input
                  type="text"
                  readonly
                  class="form-control form-control-sm input-row-fc"
                  data-index="${i}"
                  value="${(gross > 0 && net > 0) ? fc.toFixed(2) : '-'}"
                  placeholder="1.00"
                  title="Fator de Correção Calculado (Peso Bruto / Peso Líquido)"
                  style="background: var(--color-surface-container); font-weight: 600; text-align: center;"
                />
              </div>
              <div class="sheet-ing-col-measure">
                <label class="form-label-xs">Medida Caseira</label>
                <input
                  type="text"
                  class="form-control form-control-sm input-row-measure"
                  data-index="${i}"
                  value="${item.homemade_measure || ''}"
                  placeholder="Ex: 1 unidade, 8 colheres sopa"
                />
              </div>
              <div class="sheet-ing-col-cost">
                <label class="form-label-xs">Custo (R$)</label>
                <input
                  type="text"
                  readonly
                  class="form-control form-control-sm input-row-cost"
                  data-index="${i}"
                  value="R$ ${costVal.toFixed(2)}"
                  style="background: var(--color-surface-container); font-weight: 600;"
                />
              </div>
              <div class="sheet-ing-col-action">
                <label class="form-label-xs">&nbsp;</label>
                <button type="button" class="btn-icon-delete-row" data-index="${i}" title="Remover este item">
                  ${ICONS.close}
                </button>
              </div>
            </div>
          `;
        }).join('');

        const updateDropdownList = (dropdown: HTMLElement, query: string, rowIndex: number, currentTab = 'all') => {
          const listEl = dropdown.querySelector<HTMLElement>('.combobox-items-list')!;
          const footerBtn = dropdown.querySelector<HTMLButtonElement>('.btn-combobox-quick-add')!;
          const q = query.toLowerCase().trim();

          const currentItem = modalSheetIngredients[rowIndex];
          const currentSelectedId = currentItem?.source_id || currentItem?.ingredient_id;
          const currentLabel = (currentItem?.name || '').toLowerCase().trim();

          // Subprodutos disponíveis (excluindo ciclos e a própria ficha)
          const currentSheetId = editingId || itemToEdit?.id;
          const availableSubs = getAvailableSubproducts(currentSheetId || undefined, cachedTechSheets, cachedCategories);

          const isFullList = !q || q === currentLabel;

          // Filtra ingredientes de catálogo
          let rawMatches: Ingredient[] = [];
          if (currentTab === 'all' || currentTab === 'raw') {
            rawMatches = isFullList
              ? cachedIngredients
              : cachedIngredients.filter(ci => {
                  const name = ci.name.toLowerCase();
                  const brand = (ci.brand || '').toLowerCase();
                  return name.includes(q) || brand.includes(q);
                });
          }

          // Filtra subprodutos
          let subMatches: PreparationTechnicalSheet[] = [];
          if (currentTab === 'all' || currentTab === 'sub') {
            subMatches = isFullList
              ? availableSubs
              : availableSubs.filter(sub => {
                  const name = sub.name.toLowerCase();
                  const code = (sub.subproduct_code || '').toLowerCase();
                  return name.includes(q) || code.includes(q);
                });
          }

          const hasAny = rawMatches.length > 0 || subMatches.length > 0;

          if (!hasAny) {
            listEl.innerHTML = `<div class="combobox-empty">Nenhum item com "${query}".</div>`;
          } else {
            let html = '';

            // Renderiza subprodutos
            if (subMatches.length > 0) {
              if (currentTab === 'all') {
                html += `<div style="padding: 4px 10px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--color-primary); background: var(--color-surface-container);">Subprodutos / Pré-preparos (${subMatches.length})</div>`;
              }
              html += subMatches.map(sub => {
                const isSelected = sub.id === currentSelectedId && currentItem?.source_type === 'subproduct';
                const costPerServing = sub.cost_per_serving !== undefined
                  ? sub.cost_per_serving
                  : (sub.total_yield > 0 ? sub.total_yield_cost / sub.total_yield : 0);

                return `
                  <div class="combobox-item ${isSelected ? 'selected' : ''}" data-type="subproduct" data-id="${sub.id}">
                    <div class="combobox-item-main">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="combobox-item-name">${sub.name}</span>
                        <span class="badge-subproduct">Subproduto</span>
                      </div>
                      <span class="combobox-item-brand">${sub.subproduct_code || 'Base de Preparo'}</span>
                    </div>
                    <div class="combobox-item-meta">
                      <span class="badge-unit">${sub.total_yield_measurement_unity}</span>
                      <span class="badge-cost">R$ ${costPerServing.toFixed(2)}</span>
                    </div>
                  </div>
                `;
              }).join('');
            }

            // Renderiza insumos de compra
            if (rawMatches.length > 0) {
              if (currentTab === 'all' && subMatches.length > 0) {
                html += `<div style="padding: 4px 10px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--color-on-surface-variant); background: var(--color-surface-container);">Insumos de Catálogo (${rawMatches.length})</div>`;
              }
              html += rawMatches.map(ci => {
                const isSelected = ci.id === currentSelectedId && currentItem?.source_type !== 'subproduct';
                return `
                  <div class="combobox-item ${isSelected ? 'selected' : ''}" data-type="raw_material" data-id="${ci.id}">
                    <div class="combobox-item-main">
                      <span class="combobox-item-name">${ci.name}</span>
                      ${ci.brand ? `<span class="combobox-item-brand">${ci.brand}</span>` : ''}
                    </div>
                    <div class="combobox-item-meta">
                      <span class="badge-unit">${ci.measurement_unity}</span>
                      <span class="badge-cost">R$ ${ci.cost.toFixed(2)}</span>
                    </div>
                  </div>
                `;
              }).join('');
            }

            listEl.innerHTML = html;

            const selectedItemEl = listEl.querySelector<HTMLElement>('.combobox-item.selected');
            if (selectedItemEl && typeof selectedItemEl.scrollIntoView === 'function') {
              setTimeout(() => {
                selectedItemEl.scrollIntoView({ block: 'nearest' });
              }, 10);
            }
          }

          footerBtn.innerHTML = (!isFullList && q)
            ? `<span class="btn-icon">${ICONS.plus}</span> Cadastrar "${query}" no Catálogo`
            : `<span class="btn-icon">${ICONS.plus}</span> Cadastrar Novo Ingrediente`;

          listEl.querySelectorAll<HTMLElement>('.combobox-item').forEach(itemEl => {
            itemEl.addEventListener('click', (e) => {
              e.stopPropagation();
              const itemType = itemEl.getAttribute('data-type') as IngredientSourceType;
              const itemId = itemEl.getAttribute('data-id')!;

              if (itemType === 'subproduct') {
                const sub = availableSubs.find(s => s.id === itemId);
                if (sub) {
                  const costPerServing = sub.cost_per_serving !== undefined
                    ? sub.cost_per_serving
                    : (sub.total_yield > 0 ? sub.total_yield_cost / sub.total_yield : 0);
                  selectItemForRow(rowIndex, {
                    source_type: 'subproduct',
                    source_id: sub.id,
                    name: sub.name,
                    brand_or_tag: 'Subproduto',
                    measurement_unity: sub.total_yield_measurement_unity,
                    unit_cost: costPerServing
                  });
                }
              } else {
                const ci = cachedIngredients.find(x => x.id === itemId);
                if (ci) {
                  selectItemForRow(rowIndex, {
                    source_type: 'raw_material',
                    source_id: ci.id,
                    name: ci.name,
                    brand_or_tag: ci.brand || '',
                    measurement_unity: ci.measurement_unity,
                    unit_cost: ci.cost
                  });
                }
              }
              dropdown.style.display = 'none';
            });
          });
        };

        const closeAllDropdowns = () => {
          container.querySelectorAll<HTMLElement>('.combobox-dropdown').forEach(dd => {
            dd.style.display = 'none';
          });
        };

        container.querySelectorAll<HTMLElement>('.searchable-combobox').forEach(combobox => {
          const rowIndex = Number(combobox.getAttribute('data-index'));
          const searchInp = combobox.querySelector<HTMLInputElement>('.input-ing-search')!;
          const dropdown = combobox.querySelector<HTMLElement>('.combobox-dropdown')!;
          let activeTab = 'all';

          const openDropdown = (showAll = false) => {
            closeAllDropdowns();
            updateDropdownList(dropdown, showAll ? '' : searchInp.value, rowIndex, activeTab);
            dropdown.style.display = 'block';
          };

          // Abas do combobox
          dropdown.querySelectorAll<HTMLButtonElement>('.combobox-tab-btn').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              dropdown.querySelectorAll('.combobox-tab-btn').forEach(b => b.classList.remove('active'));
              tabBtn.classList.add('active');
              activeTab = tabBtn.getAttribute('data-tab') || 'all';
              updateDropdownList(dropdown, searchInp.value, rowIndex, activeTab);
            });
          });

          searchInp.addEventListener('focus', () => {
            searchInp.select();
            openDropdown(true);
          });

          searchInp.addEventListener('click', () => {
            if (dropdown.style.display !== 'block') {
              searchInp.select();
              openDropdown(true);
            }
          });

          searchInp.addEventListener('input', () => {
            updateDropdownList(dropdown, searchInp.value, rowIndex, activeTab);
            dropdown.style.display = 'block';
          });

          const toggleBtn = combobox.querySelector<HTMLButtonElement>('.btn-combobox-toggle')!;
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown.style.display === 'block') {
              dropdown.style.display = 'none';
            } else {
              searchInp.select();
              openDropdown(true);
            }
          });

          const footerBtn = dropdown.querySelector<HTMLButtonElement>('.btn-combobox-quick-add')!;
          footerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = 'none';
            openQuickIngModal(rowIndex, searchInp.value);
          });
        });

        // Suporte para atualização programática ou via testes no input hidden
        container.querySelectorAll<HTMLInputElement>('.select-row-ing').forEach(hiddenInp => {
          hiddenInp.addEventListener('change', (e) => {
            const idx = Number((e.target as HTMLElement).getAttribute('data-index'));
            const selectedId = (e.target as HTMLInputElement).value;
            selectIngredientForRow(idx, selectedId);
          });
        });

        const onDocumentClick = (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.searchable-combobox')) {
            container.querySelectorAll<HTMLInputElement>('.input-ing-search').forEach(inp => {
              const rIdx = Number(inp.getAttribute('data-index'));
              const itm = modalSheetIngredients[rIdx];
              if (itm) {
                if (itm.source_type === 'subproduct') {
                  inp.value = itm.name || '';
                } else {
                  const selId = itm.source_id || itm.ingredient_id;
                  const ingObj = cachedIngredients.find(ci => ci.id === selId) || INITIAL_INGREDIENTS.find(ci => ci.id === selId);
                  if (ingObj) {
                    inp.value = `${ingObj.name}${ingObj.brand ? ` (${ingObj.brand})` : ''}`;
                  } else if (!selId) {
                    inp.value = '';
                  }
                }
              }
            });
            closeAllDropdowns();
          }
        };
        document.removeEventListener('click', (container as any)._onDocClick);
        (container as any)._onDocClick = onDocumentClick;
        document.addEventListener('click', onDocumentClick);

        container.querySelectorAll<HTMLInputElement>('.input-row-gross').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const idx = Number((e.target as HTMLElement).getAttribute('data-index'));
            const grossVal = parseNumber((e.target as HTMLInputElement).value, 0);
            modalSheetIngredients[idx].gross_weight = grossVal;

            const unitCost = modalSheetIngredients[idx].unit_cost || 0;
            const netVal = modalSheetIngredients[idx].net_weight || 0;
            const fc = (netVal > 0 && grossVal > 0) ? calculateCorrectionFactor(grossVal, netVal) : 1.0;
            modalSheetIngredients[idx].correction_factor = fc;
            const cost = calculateItemCost(grossVal, unitCost);
            modalSheetIngredients[idx].calculated_cost = cost;
            modalSheetIngredients[idx].cost = cost;

            const rowEl = container.querySelector(`.sheet-ing-row[data-index="${idx}"]`);
            if (rowEl) {
              const costInp = rowEl.querySelector<HTMLInputElement>('.input-row-cost');
              const fcInp = rowEl.querySelector<HTMLInputElement>('.input-row-fc');
              if (costInp) costInp.value = `R$ ${cost.toFixed(2)}`;
              if (fcInp) fcInp.value = (netVal > 0 && grossVal > 0) ? fc.toFixed(2) : '-';
            }
            updateCalculatedCost();
          });
        });

        container.querySelectorAll<HTMLInputElement>('.input-row-net').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const idx = Number((e.target as HTMLElement).getAttribute('data-index'));
            const netVal = parseNumber((e.target as HTMLInputElement).value, 0);
            modalSheetIngredients[idx].net_weight = netVal;

            const grossVal = modalSheetIngredients[idx].gross_weight || 0;
            const fc = (netVal > 0 && grossVal > 0) ? calculateCorrectionFactor(grossVal, netVal) : 1.0;
            modalSheetIngredients[idx].correction_factor = fc;

            const rowEl = container.querySelector(`.sheet-ing-row[data-index="${idx}"]`);
            if (rowEl) {
              const fcInp = rowEl.querySelector<HTMLInputElement>('.input-row-fc');
              if (fcInp) fcInp.value = (netVal > 0 && grossVal > 0) ? fc.toFixed(2) : '-';
            }
            updateCalculatedCost();
          });
        });

        container.querySelectorAll<HTMLInputElement>('.input-row-measure').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const idx = Number((e.target as HTMLElement).getAttribute('data-index'));
            modalSheetIngredients[idx].homemade_measure = (e.target as HTMLInputElement).value;
          });
        });

        container.querySelectorAll<HTMLButtonElement>('.btn-icon-delete-row').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('button');
            const idx = Number(target?.getAttribute('data-index'));
            if (!isNaN(idx)) {
              modalSheetIngredients.splice(idx, 1);
              renderSheetIngredients();
              updateCalculatedCost();
            }
          });
        });
      };

      const addIngredientRow = () => {
        modalSheetIngredients.push({
          id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          source_type: 'raw_material',
          source_id: '',
          ingredient_id: '',
          name: '',
          measurement_unity: 'kg',
          net_weight: 1.0,
          gross_weight: 0,
          correction_factor: 1.0,
          unit_cost: 0,
          calculated_cost: 0,
          homemade_measure: '',
          cost: 0
        });

        renderSheetIngredients();
        updateCalculatedCost();

        // Foca automaticamente no input de busca da nova linha para facilitar a digitação imediata
        const newIndex = modalSheetIngredients.length - 1;
        const newRow = modalFields.querySelector<HTMLElement>(`.sheet-ing-row[data-index="${newIndex}"]`);
        if (newRow) {
          const searchInput = newRow.querySelector<HTMLInputElement>('.input-ing-search');
          if (searchInput) {
            setTimeout(() => {
              searchInput.focus();
            }, 30);
          }
        }
      };

      modalFields.querySelector('#btn-header-quick-add-ing')?.addEventListener('click', () => openQuickIngModal(null, ''));
      modalFields.querySelector('#btn-add-sheet-ingredient')?.addEventListener('click', addIngredientRow);
      modalFields.querySelector('#input-sheet-yield')?.addEventListener('input', updateCalculatedCost);

      refreshSheetIngredientsFn = renderSheetIngredients;
      updateCalculatedCostFn = updateCalculatedCost;

      renderSheetIngredients();
      updateCalculatedCost();
    } else if (isDish) {
      modalFields.innerHTML = `
        <div class="form-group">
          <label for="input-dish-name" class="form-label">Nome do Prato *</label>
          <input
            type="text"
            id="input-dish-name"
            class="form-control"
            required
            placeholder="Ex: Medalhão de Mignon com Risoto de Funghi..."
            value="${itemToEdit?.name || ''}"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Fichas Técnicas que Compõem o Prato *</label>
          <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 6px;">Selecione as preparações que formam este prato:</p>
          <div class="checkbox-list">
            ${cachedTechSheets && cachedTechSheets.length > 0 ? cachedTechSheets.map(s => `
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  name="dish_sheet_id"
                  value="${s.id}"
                  ${itemToEdit?.preparation_technical_sheet_ids?.includes(s.id) ? 'checked' : ''}
                />
                <span><strong>${s.name}</strong> <span class="checkbox-meta">(${s.id} - ${s.total_yield} ${s.total_yield_measurement_unity})</span></span>
              </label>
            `).join('') : '<p class="text-muted" style="padding: 6px;">Nenhuma ficha técnica cadastrada. Cadastre em Fichas Técnicas primeiro ou prossiga sem fichas.</p>'}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Ingrediente Extra / Guarnição Opcional</label>
          <div class="form-grid-2">
            <input
              type="text"
              id="input-dish-extra-name"
              class="form-control"
              placeholder="Ex: Crisp de Alho-poró"
              value="${itemToEdit?.extra_ingredients?.[0]?.ingredient_id || ''}"
            />
            <div style="display: flex; gap: 8px;">
              <input
                type="number"
                id="input-dish-extra-qty"
                class="form-control"
                placeholder="Qtd (ex: 50)"
                value="${itemToEdit?.extra_ingredients?.[0]?.quantity || ''}"
              />
              <input
                type="text"
                id="input-dish-extra-unit"
                class="form-control"
                placeholder="Unid (g, ml)"
                style="max-width: 90px;"
                value="${itemToEdit?.extra_ingredients?.[0]?.unit || 'g'}"
              />
            </div>
          </div>
        </div>
      `;
    }
  };

  btnOpenModal.addEventListener('click', () => {
    editingId = null;
    setupFormFields();
    openModal();
  });

  // SUBMIT DO FORMULÁRIO (SALVAR OU ATUALIZAR NO FIRESTORE)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Gravando no Firestore...';

    const id = editingId || `${path.replace('/', '')}-${Date.now().toString(36)}`;
    const existing = editingId ? currentItems.find(it => it.id === editingId) : null;
    const targetTenantId = existing?.tenantId || tenantId;

    try {
      if (isCategory) {
        const name = (content.querySelector<HTMLInputElement>('#input-cat-name')!).value.trim();
        const category: DishCategory = { id, tenantId: targetTenantId, name };
        await catRepo.save(category);
        showToast('✓ Categoria salva no Cloud Firestore com sucesso!');
      } else if (isIngredient) {
        const name = (content.querySelector<HTMLInputElement>('#input-ing-name')!).value.trim();
        const brand = (content.querySelector<HTMLInputElement>('#input-ing-brand')!).value.trim();
        const measurement_unity = (content.querySelector<HTMLSelectElement>('#select-ing-unit')!).value;
        const cost = parseNumber((content.querySelector<HTMLInputElement>('#input-ing-cost')!).value, 0);
        const total_yield_homemade_measure = (content.querySelector<HTMLInputElement>('#input-ing-homemade')!).value.trim();

        const ingredient: Ingredient = {
          id,
          tenantId: targetTenantId,
          name,
          brand,
          measurement_unity,
          cost,
          total_yield_homemade_measure
        };
        await ingRepo.save(ingredient);
        showToast('✓ Ingrediente salvo no Cloud Firestore com sucesso!');
      } else if (isTechSheet) {
        const name = (content.querySelector<HTMLInputElement>('#input-sheet-name')!).value.trim();
        const dish_category_id = (content.querySelector<HTMLSelectElement>('#select-sheet-cat')!).value;
        const is_pre_preparation = Boolean(content.querySelector<HTMLInputElement>('#check-sheet-is-pre-prep')?.checked);
        const subproduct_code = is_pre_preparation
          ? (name.toLowerCase().startsWith('sb ') ? name : `SB ${name}`)
          : undefined;
        const total_yield = parseNumber((content.querySelector<HTMLInputElement>('#input-sheet-yield')!).value, 1);
        const total_yield_measurement_unity = (content.querySelector<HTMLInputElement>('#input-sheet-yield-unit')!).value.trim() || 'porções';
        const total_yield_weight = parseNumber((content.querySelector<HTMLInputElement>('#input-sheet-weight')!).value, 0);

        // Processa ingredientes da ficha técnica
        const ingredients: TechnicalSheetIngredientItem[] = modalSheetIngredients
          .filter(it => it.source_id || it.ingredient_id)
          .map(it => {
            const gross = parseNumber(it.gross_weight, 0);
            const net = parseNumber(it.net_weight, 0);
            const fc = (net > 0 && gross > 0) ? calculateCorrectionFactor(gross, net) : (it.correction_factor || 1.0);
            const unit_cost = Number(it.unit_cost) || 0;
            const calculated_cost = calculateItemCost(gross, unit_cost);

            return {
              id: it.id || `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              source_type: it.source_type || 'raw_material',
              source_id: it.source_id || it.ingredient_id || '',
              ingredient_id: it.source_id || it.ingredient_id || '',
              name: it.name || '',
              brand_or_tag: it.brand_or_tag || (it.source_type === 'subproduct' ? 'Subproduto' : ''),
              measurement_unity: it.measurement_unity || 'kg',
              gross_weight: gross,
              net_weight: net,
              correction_factor: fc,
              unit_cost,
              calculated_cost,
              cost: calculated_cost,
              homemade_measure: it.homemade_measure ? it.homemade_measure.trim() : ''
            };
          });

        // Prevenção de ciclos se for um pré-preparo
        if (is_pre_preparation) {
          for (const itm of ingredients) {
            if (itm.source_type === 'subproduct' && itm.source_id) {
              if (hasCycle(id, itm.source_id, cachedTechSheets)) {
                throw new Error(`Dependência cíclica detectada: O pré-preparo "${name}" não pode incluir o subproduto "${itm.name}".`);
              }
            }
          }
        }

        const total_gross_weight = Number(ingredients.reduce((sum, it) => sum + (it.gross_weight || 0), 0).toFixed(3));
        const total_net_weight = Number(ingredients.reduce((sum, it) => sum + (it.net_weight || 0), 0).toFixed(3));
        const total_yield_cost = Number(
          ingredients.reduce((sum, it) => sum + (it.calculated_cost || it.cost || 0), 0).toFixed(2)
        );
        const cost_per_serving = total_yield > 0 ? Number((total_yield_cost / total_yield).toFixed(2)) : 0;

        const methodText = (content.querySelector<HTMLTextAreaElement>('#textarea-sheet-method')!).value;
        const preparation_method = methodText.split('\n').map(l => l.trim()).filter(Boolean);

        const sheet: PreparationTechnicalSheet = {
          id,
          tenantId: targetTenantId,
          name,
          dish_category_id,
          is_pre_preparation,
          subproduct_code,
          ingredients,
          preparation_method,
          total_gross_weight,
          total_net_weight,
          total_yield,
          total_yield_measurement_unity,
          total_yield_weight: total_yield_weight || total_gross_weight,
          total_yield_cost,
          cost_per_serving
        };

        await sheetRepo.save(sheet);

        // Atualiza cachedTechSheets imediatamente na memória
        const existingIdx = cachedTechSheets.findIndex(s => s.id === sheet.id);
        if (existingIdx >= 0) {
          cachedTechSheets[existingIdx] = sheet;
        } else {
          cachedTechSheets.push(sheet);
        }

        // Se for pré-preparo, propaga o novo custo para as fichas que o utilizam
        let cascadedSheets: PreparationTechnicalSheet[] = [];
        if (is_pre_preparation) {
          cascadedSheets = propagateSubproductCostUpdate(sheet, cachedTechSheets, cachedIngredients);
          for (const cascaded of cascadedSheets) {
            await sheetRepo.save(cascaded);
            const cIdx = cachedTechSheets.findIndex(s => s.id === cascaded.id);
            if (cIdx >= 0) cachedTechSheets[cIdx] = cascaded;
            else cachedTechSheets.push(cascaded);
          }
        }

        const msg = cascadedSheets.length > 0
          ? `✓ Ficha técnica salva no Cloud Firestore com sucesso! (${cascadedSheets.length} ficha(s) dependente(s) recalculada(s))`
          : '✓ Ficha técnica salva no Cloud Firestore com sucesso!';
        showToast(msg);
      } else if (isDish) {
        const name = (content.querySelector<HTMLInputElement>('#input-dish-name')!).value.trim();
        const checkedBoxes = content.querySelectorAll<HTMLInputElement>('input[name="dish_sheet_id"]:checked');
        const preparation_technical_sheet_ids: string[] = [];
        checkedBoxes.forEach(cb => preparation_technical_sheet_ids.push(cb.value));

        const extraName = (content.querySelector<HTMLInputElement>('#input-dish-extra-name')!).value.trim();
        const extraQty = parseNumber((content.querySelector<HTMLInputElement>('#input-dish-extra-qty')!).value, 0);
        const extraUnit = (content.querySelector<HTMLInputElement>('#input-dish-extra-unit')!).value.trim() || 'g';
        const extra_ingredients = extraName ? [{ ingredient_id: extraName, quantity: extraQty, unit: extraUnit }] : [];

        const dish: Dish = {
          id,
          tenantId: targetTenantId,
          name,
          preparation_technical_sheet_ids,
          extra_ingredients
        };
        await dishRepo.save(dish);
        showToast('✓ Prato salvo no Cloud Firestore com sucesso!');
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar no Firestore:', err);
      showToast(`Erro ao salvar: ${err.message || 'Falha de comunicação'}`, true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Salvar no Firestore';
    }
  });

  // RENDERIZAÇÃO DA TABELA CONECTADA
  const renderTable = (items: any[]) => {
    tbody.innerHTML = '';

    if (items.length === 0) {
      tableArea.style.display = 'none';
      emptyEl.style.display = 'flex';
      return;
    }

    tableArea.style.display = 'block';
    emptyEl.style.display = 'none';

    if (isCategory) {
      thead.innerHTML = `
        <tr>
          <th>Código</th>
          <th>Nome da Categoria</th>
          <th>Empresa (Tenant)</th>
          <th class="th-actions">Ações</th>
        </tr>
      `;

      items.forEach((cat: DishCategory) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Código"><code>${cat.id}</code></td>
          <td data-label="Categoria"><strong>${cat.name}</strong></td>
          <td data-label="Empresa"><span class="tenant-tag">${cat.tenantId}</span></td>
          <td class="td-actions" data-label="Ações">
            <button type="button" class="btn btn-ghost btn-sm btn-edit" data-id="${cat.id}">Editar</button>
            <button type="button" class="btn btn-ghost btn-sm btn-delete" data-id="${cat.id}" style="color: var(--color-error);">Excluir</button>
          </td>
        `;

        tr.querySelector('.btn-edit')?.addEventListener('click', () => {
          editingId = cat.id;
          setupFormFields(cat);
          openModal();
        });

        tr.querySelector('.btn-delete')?.addEventListener('click', async () => {
          if (confirm(`Tem certeza que deseja excluir a categoria "${cat.name}"?`)) {
            try {
              await catRepo.delete(cat.id, tenantId);
              showToast('✓ Categoria excluída com sucesso!');
              await loadData();
            } catch (err: any) {
              showToast(`Erro ao excluir: ${err.message}`, true);
            }
          }
        });

        tbody.appendChild(tr);
      });
    } else if (isIngredient) {
      thead.innerHTML = `
        <tr>
          <th>Ingrediente</th>
          <th>Marca</th>
          <th>Unid</th>
          <th>Custo Unitário</th>
          <th>Rendimento Caseiro</th>
          <th class="th-actions">Ações</th>
        </tr>
      `;

      items.forEach((ing: Ingredient) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Ingrediente"><strong>${ing.name}</strong></td>
          <td data-label="Marca">${ing.brand || '-'}</td>
          <td data-label="Unidade"><span class="badge-neutral">${ing.measurement_unity}</span></td>
          <td data-label="Custo unitário"><strong>R$ ${ing.cost.toFixed(2)}</strong></td>
          <td data-label="Medida caseira"><small>${ing.total_yield_homemade_measure || '-'}</small></td>
          <td class="td-actions" data-label="Ações">
            <button type="button" class="btn btn-ghost btn-sm btn-edit" data-id="${ing.id}">Editar</button>
            <button type="button" class="btn btn-ghost btn-sm btn-delete" data-id="${ing.id}" style="color: var(--color-error);">Excluir</button>
          </td>
        `;

        tr.querySelector('.btn-edit')?.addEventListener('click', () => {
          editingId = ing.id;
          setupFormFields(ing);
          openModal();
        });

        tr.querySelector('.btn-delete')?.addEventListener('click', async () => {
          if (confirm(`Tem certeza que deseja excluir o ingrediente "${ing.name}"?`)) {
            try {
              await ingRepo.delete(ing.id, tenantId);
              showToast('✓ Ingrediente excluído com sucesso!');
              await loadData();
            } catch (err: any) {
              showToast(`Erro ao excluir: ${err.message}`, true);
            }
          }
        });

        tbody.appendChild(tr);
      });
    } else if (isTechSheet) {
      thead.innerHTML = `
        <tr>
          <th>Nome da Preparação</th>
          <th>Categoria</th>
          <th>Rendimento</th>
          <th>Ingredientes</th>
          <th>Custo Calculado</th>
          <th class="th-actions">Ações</th>
        </tr>
      `;

      items.forEach((sheet: PreparationTechnicalSheet) => {
        const cat = cachedCategories.find(c => c.id === sheet.dish_category_id);
        const catName = cat ? cat.name : sheet.dish_category_id || 'Não vinculada';
        const ingCount = sheet.ingredients?.length || 0;
        const costPerUnit = sheet.total_yield && sheet.total_yield > 0
          ? (sheet.total_yield_cost / sheet.total_yield)
          : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Preparação">
            <strong>${sheet.name}</strong>
            ${sheet.is_pre_preparation ? `<span class="badge-subproduct" style="margin-left: 6px;">${sheet.subproduct_code || 'Pré-preparo'}</span>` : ''}
          </td>
          <td data-label="Categoria"><span class="category-tag">${catName}</span></td>
          <td data-label="Rendimento">${sheet.total_yield} ${sheet.total_yield_measurement_unity}</td>
          <td data-label="Ingredientes">
            <span class="category-tag" style="background: var(--color-surface-container); color: var(--color-on-surface);">
              ${ingCount} ${ingCount === 1 ? 'insumo' : 'insumos'}
            </span>
          </td>
          <td data-label="Custo calculado">
            <strong>R$ ${sheet.total_yield_cost ? sheet.total_yield_cost.toFixed(2) : '0.00'}</strong>
            <br>
            <small class="text-muted">R$ ${costPerUnit.toFixed(2)} / ${sheet.total_yield_measurement_unity}</small>
          </td>
          <td class="td-actions" data-label="Ações">
            <div class="table-actions-group">
              <button type="button" class="btn-icon-action btn-edit" data-id="${sheet.id}" title="Editar Ficha Técnica" aria-label="Editar Ficha Técnica">
                ${ICONS.pencil}
              </button>
              <button type="button" class="btn-icon-action btn-delete" data-id="${sheet.id}" title="Excluir Ficha Técnica" aria-label="Excluir Ficha Técnica">
                ${ICONS.trash}
              </button>
            </div>
          </td>
        `;

        tr.querySelector('.btn-edit')?.addEventListener('click', () => {
          const sheetToEdit = currentItems.find(it => it.id === sheet.id) || sheet;
          editingId = sheetToEdit.id;
          setupFormFields(sheetToEdit);
          openModal();
        });

        tr.querySelector('.btn-delete')?.addEventListener('click', async () => {
          if (confirm(`Tem certeza que deseja excluir a ficha técnica "${sheet.name}"?`)) {
            try {
              await sheetRepo.delete(sheet.id, tenantId);
              showToast('✓ Ficha técnica excluída com sucesso!');
              await loadData();
            } catch (err: any) {
              showToast(`Erro ao excluir: ${err.message}`, true);
            }
          }
        });

        tbody.appendChild(tr);
      });
    } else if (isDish) {
      thead.innerHTML = `
        <tr>
          <th>Código</th>
          <th>Nome do Prato</th>
          <th>Fichas Técnicas Associadas</th>
          <th>Ingredientes Extras</th>
          <th class="th-actions">Ações</th>
        </tr>
      `;

      items.forEach((dish: Dish) => {
        const sheetBadges = dish.preparation_technical_sheet_ids && dish.preparation_technical_sheet_ids.length > 0
          ? dish.preparation_technical_sheet_ids.map(id => {
              const s = cachedTechSheets.find(sheet => sheet.id === id);
              return `<span class="category-tag" title="${id}">${s ? s.name : id}</span>`;
            }).join(' ')
          : '<span class="text-muted">Nenhuma</span>';

        const extrasText = dish.extra_ingredients && dish.extra_ingredients.length > 0
          ? dish.extra_ingredients.map(e => `${e.quantity} ${e.unit} ${e.ingredient_id}`).join(', ')
          : '<span class="text-muted">-</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Código"><code>${dish.id}</code></td>
          <td data-label="Prato"><strong>${dish.name}</strong></td>
          <td data-label="Fichas técnicas">${sheetBadges}</td>
          <td data-label="Ingredientes extras">${extrasText}</td>
          <td class="td-actions" data-label="Ações">
            <button type="button" class="btn btn-ghost btn-sm btn-edit" data-id="${dish.id}">Editar</button>
            <button type="button" class="btn btn-ghost btn-sm btn-delete" data-id="${dish.id}" style="color: var(--color-error);">Excluir</button>
          </td>
        `;

        tr.querySelector('.btn-edit')?.addEventListener('click', () => {
          editingId = dish.id;
          setupFormFields(dish);
          openModal();
        });

        tr.querySelector('.btn-delete')?.addEventListener('click', async () => {
          if (confirm(`Tem certeza que deseja excluir o prato "${dish.name}"?`)) {
            try {
              await dishRepo.delete(dish.id, tenantId);
              showToast('✓ Prato excluído com sucesso!');
              await loadData();
            } catch (err: any) {
              showToast(`Erro ao excluir: ${err.message}`, true);
            }
          }
        });

        tbody.appendChild(tr);
      });
    } else {
      // Rotas secundárias (/services, /support-materials)
      thead.innerHTML = `<tr><th>Item</th><th>Descrição</th><th>Status</th></tr>`;
      tbody.innerHTML = `<tr><td colspan="3" class="text-muted">Módulo em preparação operacional.</td></tr>`;
    }
  };

  const filterTable = () => {
    const q = filterInput.value.toLowerCase().trim();
    if (!q) {
      renderTable(currentItems);
      return;
    }
    const filtered = currentItems.filter((it) =>
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.brand && it.brand.toLowerCase().includes(q)) ||
      (it.id && it.id.toLowerCase().includes(q))
    );
    renderTable(filtered);
  };

  filterInput.addEventListener('input', filterTable);

  // CARREGAMENTO DOS DADOS DO CLOUD FIRESTORE
  const loadData = async () => {
    loadingEl.style.display = 'flex';
    tableArea.style.display = 'none';
    emptyEl.style.display = 'none';

    try {
      if (isCategory) {
        let cats = await catRepo.listByTenant(tenantId);
        if (cats.length === 0) {
          cats = INITIAL_CATEGORIES.map(c => ({ ...c, tenantId }));
          Promise.all(cats.map(c => catRepo.save(c))).catch(() => {});
        }
        currentItems = cats;
        cachedCategories = cats;
      } else if (isIngredient) {
        let ings = await ingRepo.listByTenant(tenantId);
        if (ings.length === 0) {
          ings = INITIAL_INGREDIENTS.map(i => ({ ...i, tenantId }));
          Promise.all(ings.map(i => ingRepo.save(i))).catch(() => {});
        }
        currentItems = ings;
      } else if (isTechSheet) {
        cachedCategories = await catRepo.listByTenant(tenantId);
        if (cachedCategories.length === 0) {
          cachedCategories = INITIAL_CATEGORIES.map(c => ({ ...c, tenantId }));
        }

        let dbIngredients = await ingRepo.listByTenant(tenantId);
        if (dbIngredients.length === 0) {
          dbIngredients = INITIAL_INGREDIENTS.map(i => ({ ...i, tenantId }));
          Promise.all(dbIngredients.map(i => ingRepo.save(i))).catch(() => {});
        } else {
          // Garante que os insumos base estejam disponíveis caso referenciados nas fichas
          const existingIds = new Set(dbIngredients.map(i => i.id));
          INITIAL_INGREDIENTS.forEach(initIng => {
            if (!existingIds.has(initIng.id)) {
              dbIngredients.push({ ...initIng, tenantId });
            }
          });
        }
        cachedIngredients = dbIngredients;

        let sheets = await sheetRepo.listByTenant(tenantId);
        if (sheets.length === 0) {
          sheets = INITIAL_TECHNICAL_SHEETS.map(s => ({ ...s, tenantId }));
          Promise.all(sheets.map(s => sheetRepo.save(s))).catch(() => {});
        } else {
          // Migração retroativa: Se as fichas técnicas no Firestore estão sem ingredientes
          // (criadas antes da implementação do array de ingredientes), restaura da receita padrão e atualiza no Firestore
          sheets = sheets.map(sheet => {
            if (!sheet.ingredients || sheet.ingredients.length === 0) {
              const seed = INITIAL_TECHNICAL_SHEETS.find(
                s => s.id === sheet.id || s.name.toLowerCase() === sheet.name.toLowerCase()
              );
              if (seed && seed.ingredients && seed.ingredients.length > 0) {
                const updated = {
                  ...sheet,
                  ingredients: seed.ingredients.map(it => ({ ...it })),
                  total_yield_cost: seed.total_yield_cost,
                  total_yield_weight: seed.total_yield_weight
                };
                sheetRepo.save(updated).catch(() => {});
                return updated;
              }
            }
            return sheet;
          });
        }
        currentItems = sheets;
        cachedTechSheets = sheets;
      } else if (isDish) {
        // Carrega fichas técnicas para os checkboxes
        cachedTechSheets = await sheetRepo.listByTenant(tenantId);
        if (cachedTechSheets.length === 0) {
          cachedTechSheets = INITIAL_TECHNICAL_SHEETS.map(s => ({ ...s, tenantId }));
        }

        let dishes = await dishRepo.listByTenant(tenantId);
        if (dishes.length === 0) {
          dishes = INITIAL_DISHES.map(d => ({ ...d, tenantId }));
          Promise.all(dishes.map(d => dishRepo.save(d))).catch(() => {});
        }
        currentItems = dishes;
      }

      loadingEl.style.display = 'none';
      filterTable();
    } catch (err) {
      console.warn('Falha na consulta ao Firestore, usando dados locais de demonstração:', err);
      if (isCategory) currentItems = INITIAL_CATEGORIES.map(c => ({ ...c, tenantId }));
      if (isIngredient) currentItems = INITIAL_INGREDIENTS.map(i => ({ ...i, tenantId }));
      if (isTechSheet) {
        cachedCategories = INITIAL_CATEGORIES.map(c => ({ ...c, tenantId }));
        cachedIngredients = INITIAL_INGREDIENTS.map(i => ({ ...i, tenantId }));
        currentItems = INITIAL_TECHNICAL_SHEETS.map(s => ({ ...s, tenantId }));
        cachedTechSheets = currentItems;
      }
      if (isDish) currentItems = INITIAL_DISHES.map(d => ({ ...d, tenantId }));
      loadingEl.style.display = 'none';
      filterTable();
    }
  };

  loadData();

  return createAppShell(path, content);
}
