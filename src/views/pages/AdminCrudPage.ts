import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';
import { createAppShell } from '@/views/components/AppShell';
import { ICONS } from '@/views/icons/icons';
import { categoryRepository, ICategoryRepository } from '@/models/repositories/categoryRepository';
import { ingredientRepository, IIngredientRepository } from '@/models/repositories/ingredientRepository';
import { technicalSheetRepository, ITechnicalSheetRepository } from '@/models/repositories/technicalSheetRepository';
import { dishRepository, IDishRepository } from '@/models/repositories/dishRepository';
import { DishCategory, Ingredient, PreparationTechnicalSheet, Dish } from '@/models/types/recipe.types';

export const INITIAL_CATEGORIES: DishCategory[] = [
  { id: 'cat-01', tenantId: 'default-tenant', name: 'Entradas & Finger Foods' },
  { id: 'cat-02', tenantId: 'default-tenant', name: 'Pratos Principais (Carnes Nobres)' },
  { id: 'cat-03', tenantId: 'default-tenant', name: 'Acompanhamentos & Risotos' },
  { id: 'cat-04', tenantId: 'default-tenant', name: 'Sobremesas Finas' },
  { id: 'cat-05', tenantId: 'default-tenant', name: 'Bebidas & Coquetelaria' }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-01', tenantId: 'default-tenant', name: 'Filé Mignon Limpo', brand: 'Friboi Black / Swift', measurement_unity: 'kg', correction_factor: 1.25, cost: 78.50, total_yield_homemade_measure: '1 bife médio (180g)' },
  { id: 'ing-02', tenantId: 'default-tenant', name: 'Arroz Arbóreo', brand: 'La Pastina', measurement_unity: 'kg', correction_factor: 1.00, cost: 24.90, total_yield_homemade_measure: '1 xícara (200g)' },
  { id: 'ing-03', tenantId: 'default-tenant', name: 'Queijo Parmesão Grana Padano', brand: 'Importado', measurement_unity: 'kg', correction_factor: 1.02, cost: 145.00, total_yield_homemade_measure: '1 colher sopa (20g)' },
  { id: 'ing-04', tenantId: 'default-tenant', name: 'Creme de Leite Fresco 35%', brand: 'Xandô', measurement_unity: 'l', correction_factor: 1.00, cost: 32.00, total_yield_homemade_measure: '1 xícara (240ml)' },
  { id: 'ing-05', tenantId: 'default-tenant', name: 'Azeite de Oliva Extra Virgem', brand: 'Gallo / Andorinha', measurement_unity: 'l', correction_factor: 1.00, cost: 48.00, total_yield_homemade_measure: '1 colher sopa (15ml)' }
];

export const INITIAL_TECHNICAL_SHEETS: PreparationTechnicalSheet[] = [
  {
    id: 'ft-001',
    tenantId: 'default-tenant',
    dish_category_id: 'cat-02',
    name: 'Filé Mignon ao Molho Roti',
    ingredients: [],
    preparation_method: ['Selar os medalhões em fogo alto', 'Reduzir o caldo de ossos para o molho roti', 'Finalizar com manteiga gelada'],
    total_yield: 10,
    total_yield_measurement_unity: 'porções',
    total_yield_weight: 2.2,
    total_yield_cost: 184.20
  },
  {
    id: 'ft-002',
    tenantId: 'default-tenant',
    dish_category_id: 'cat-03',
    name: 'Risoto de Funghi Secchi',
    ingredients: [],
    preparation_method: ['Hidratar o funghi em água morna', 'Refogar o arroz arbóreo e deglaçar com vinho branco', 'Adicionar caldo aos poucos até ponto al dente'],
    total_yield: 15,
    total_yield_measurement_unity: 'porções',
    total_yield_weight: 3.0,
    total_yield_cost: 96.50
  },
  {
    id: 'ft-003',
    tenantId: 'default-tenant',
    dish_category_id: 'cat-01',
    name: 'Bruschetta Tradizionale Caprese',
    ingredients: [],
    preparation_method: ['Tostar fatias de pão italiano com azeite', 'Cobrir com tomates picados, manjericão e mozzarella di bufala'],
    total_yield: 40,
    total_yield_measurement_unity: 'unid',
    total_yield_weight: 1.8,
    total_yield_cost: 62.80
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
                <td><strong>${user?.displayName || 'Usuário Atual'}</strong> <small>(Você)</small></td>
                <td>${user?.email}</td>
                <td><span class="user-role-badge role-${userRole}">${userRole.toUpperCase()}</span></td>
                <td><span class="badge-confirmed">Ativo</span></td>
                <td><code>${tenantId}</code></td>
                <td><span class="text-muted">Sessão Atual</span></td>
              </tr>
              <tr>
                <td><strong>Marcelo Duarte</strong></td>
                <td>chefe.marcelo@buffet.com</td>
                <td><span class="user-role-badge role-manager">MANAGER</span></td>
                <td><span class="badge-confirmed">Ativo</span></td>
                <td><code>${tenantId}</code></td>
                <td><button type="button" class="btn btn-ghost btn-sm">Editar</button></td>
              </tr>
              <tr>
                <td><strong>Carlos Silva</strong></td>
                <td>carlos.logistica@buffet.com</td>
                <td><span class="user-role-badge role-operator">OPERATOR</span></td>
                <td><span class="badge-confirmed">Ativo</span></td>
                <td><code>${tenantId}</code></td>
                <td><button type="button" class="btn btn-ghost btn-sm">Editar</button></td>
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

  const titles: Record<string, { title: string; subtitle: string }> = {
    '/categories': { title: 'Categorias de Pratos', subtitle: 'Classificação gastronómica vinculada a fichas técnicas e cardápios no Firestore.' },
    '/ingredients': { title: 'Ingredientes & Insumos', subtitle: 'Catálogo de insumos com controle de Fator de Correção (FC) e custos unitários.' },
    '/technical-sheets': { title: 'Fichas Técnicas de Preparação', subtitle: 'Fichas de rendimento, modo de preparo e custos operacionais.' },
    '/dishes': { title: 'Catálogo de Pratos', subtitle: 'Composições servidas aos convidados formadas por fichas técnicas e insumos extras.' },
    '/services': { title: 'Serviços de Eventos', subtitle: 'Modelos de serviço (Welcome Drink, Coquetel, Jantar, Carrinhos ao Vivo).' },
    '/support-materials': { title: 'Materiais de Apoio & Logística', subtitle: 'Controle de caixas secas, equipamentos térmicos, EPIs e elétrica.' }
  };

  const meta = titles[path] || { title: 'Módulo Administrativo', subtitle: 'Gestão operacional de buffet.' };
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

  let currentItems: any[] = [];
  let editingId: string | null = null;
  let cachedCategories: DishCategory[] = [];
  let cachedTechSheets: PreparationTechnicalSheet[] = [];

  const openModal = () => {
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    editingId = null;
    form.reset();
  };

  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // RENDERIZADOR DE CAMPOS DO FORMULÁRIO BASEADO NA ENTIDADE
  const setupFormFields = (itemToEdit?: any) => {
    modalTitle.textContent = itemToEdit ? `Editar ${meta.title.slice(0, -1)}` : `Novo em ${meta.title}`;

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
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="input-ing-fc" class="form-label">Fator de Correção (FC) *</label>
            <input
              type="number"
              step="0.01"
              id="input-ing-fc"
              class="form-control"
              required
              value="${itemToEdit?.correction_factor || '1.00'}"
              title="FC = Peso Bruto / Peso Líquido (mínimo 1.0)"
            />
            <small class="text-muted">Peso Bruto / Peso Líquido</small>
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
                ${c.name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="input-sheet-yield" class="form-label">Rendimento Total *</label>
            <input
              type="number"
              id="input-sheet-yield"
              class="form-control"
              required
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
        <div class="form-grid-2">
          <div class="form-group">
            <label for="input-sheet-weight" class="form-label">Peso Final Total (kg)</label>
            <input
              type="number"
              step="0.1"
              id="input-sheet-weight"
              class="form-control"
              placeholder="Ex: 2.5"
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
              placeholder="0.00"
              value="${itemToEdit?.total_yield_cost || ''}"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="textarea-sheet-method" class="form-label">Modo de Preparo (um passo por linha)</label>
          <textarea
            id="textarea-sheet-method"
            class="form-control"
            rows="4"
            placeholder="1. Selar os ingredientes...&#10;2. Cozinhar sob pressão...&#10;3. Finalizar e empratar."
          >${itemToEdit?.preparation_method ? itemToEdit.preparation_method.join('\n') : ''}</textarea>
        </div>
      `;
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
        const correction_factor = parseNumber((content.querySelector<HTMLInputElement>('#input-ing-fc')!).value, 1.0);
        const cost = parseNumber((content.querySelector<HTMLInputElement>('#input-ing-cost')!).value, 0);
        const total_yield_homemade_measure = (content.querySelector<HTMLInputElement>('#input-ing-homemade')!).value.trim();

        const ingredient: Ingredient = {
          id,
          tenantId: targetTenantId,
          name,
          brand,
          measurement_unity,
          correction_factor,
          cost,
          total_yield_homemade_measure
        };
        await ingRepo.save(ingredient);
        showToast('✓ Ingrediente salvo no Cloud Firestore com sucesso!');
      } else if (isTechSheet) {
        const name = (content.querySelector<HTMLInputElement>('#input-sheet-name')!).value.trim();
        const dish_category_id = (content.querySelector<HTMLSelectElement>('#select-sheet-cat')!).value;
        const total_yield = parseNumber((content.querySelector<HTMLInputElement>('#input-sheet-yield')!).value, 1);
        const total_yield_measurement_unity = (content.querySelector<HTMLInputElement>('#input-sheet-yield-unit')!).value.trim() || 'porções';
        const total_yield_weight = parseNumber((content.querySelector<HTMLInputElement>('#input-sheet-weight')!).value, 0);
        const total_yield_cost = parseNumber((content.querySelector<HTMLInputElement>('#input-sheet-cost')!).value, 0);
        const methodText = (content.querySelector<HTMLTextAreaElement>('#textarea-sheet-method')!).value;
        const preparation_method = methodText.split('\n').map(l => l.trim()).filter(Boolean);

        const sheet: PreparationTechnicalSheet = {
          id,
          tenantId: targetTenantId,
          name,
          dish_category_id,
          ingredients: existing?.ingredients || [],
          preparation_method,
          total_yield,
          total_yield_measurement_unity,
          total_yield_weight,
          total_yield_cost
        };
        await sheetRepo.save(sheet);
        showToast('✓ Ficha técnica salva no Cloud Firestore com sucesso!');
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
          <td><code>${cat.id}</code></td>
          <td><strong>${cat.name}</strong></td>
          <td><span class="tenant-tag">${cat.tenantId}</span></td>
          <td class="td-actions">
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
          <th>Fator Correção (FC)</th>
          <th>Custo Unitário</th>
          <th>Rendimento Caseiro</th>
          <th class="th-actions">Ações</th>
        </tr>
      `;

      items.forEach((ing: Ingredient) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${ing.name}</strong></td>
          <td>${ing.brand || '-'}</td>
          <td><span class="badge-neutral">${ing.measurement_unity}</span></td>
          <td><code>${ing.correction_factor.toFixed(2)}</code></td>
          <td><strong>R$ ${ing.cost.toFixed(2)}</strong></td>
          <td><small>${ing.total_yield_homemade_measure || '-'}</small></td>
          <td class="td-actions">
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
          <th>Código</th>
          <th>Nome da Preparação</th>
          <th>Categoria</th>
          <th>Rendimento</th>
          <th>Custo Calculado</th>
          <th class="th-actions">Ações</th>
        </tr>
      `;

      items.forEach((sheet: PreparationTechnicalSheet) => {
        const cat = cachedCategories.find(c => c.id === sheet.dish_category_id);
        const catName = cat ? cat.name : sheet.dish_category_id || 'Não vinculada';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${sheet.id}</code></td>
          <td><strong>${sheet.name}</strong></td>
          <td><span class="category-tag">${catName}</span></td>
          <td>${sheet.total_yield} ${sheet.total_yield_measurement_unity}</td>
          <td><strong>R$ ${sheet.total_yield_cost ? sheet.total_yield_cost.toFixed(2) : '0.00'}</strong></td>
          <td class="td-actions">
            <button type="button" class="btn btn-ghost btn-sm btn-edit" data-id="${sheet.id}">Editar</button>
            <button type="button" class="btn btn-ghost btn-sm btn-delete" data-id="${sheet.id}" style="color: var(--color-error);">Excluir</button>
          </td>
        `;

        tr.querySelector('.btn-edit')?.addEventListener('click', () => {
          editingId = sheet.id;
          setupFormFields(sheet);
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
          <td><code>${dish.id}</code></td>
          <td><strong>${dish.name}</strong></td>
          <td>${sheetBadges}</td>
          <td>${extrasText}</td>
          <td class="td-actions">
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

        let sheets = await sheetRepo.listByTenant(tenantId);
        if (sheets.length === 0) {
          sheets = INITIAL_TECHNICAL_SHEETS.map(s => ({ ...s, tenantId }));
          Promise.all(sheets.map(s => sheetRepo.save(s))).catch(() => {});
        }
        currentItems = sheets;
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
      if (isTechSheet) currentItems = INITIAL_TECHNICAL_SHEETS.map(s => ({ ...s, tenantId }));
      if (isDish) currentItems = INITIAL_DISHES.map(d => ({ ...d, tenantId }));
      loadingEl.style.display = 'none';
      filterTable();
    }
  };

  loadData();

  return createAppShell(path, content);
}
