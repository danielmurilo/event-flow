import { authController } from '@/controllers/auth/AuthController';
import { router } from '@/routes/router';
import { createAppShell } from '@/views/components/AppShell';
import { ICONS } from '@/views/icons/icons';

export interface AdminSectionConfig {
  path: string;
  title: string;
  subtitle: string;
  icon: string;
  columns: string[];
  initialItems: Array<Record<string, string>>;
}

export const ADMIN_SECTIONS: Record<string, AdminSectionConfig> = {
  '/categories': {
    path: '/categories',
    title: 'Categorias de Pratos',
    subtitle: 'Classificação gastronómica para fichas técnicas e cardápios.',
    icon: ICONS.tag,
    columns: ['ID', 'Nome da Categoria', 'Qtd de Fichas Vinculadas', 'Status'],
    initialItems: [
      { col1: 'CAT-01', col2: 'Entradas & Finger Foods', col3: '14 fichas', col4: 'Ativo' },
      { col1: 'CAT-02', col2: 'Pratos Principais (Carnes Nobres)', col3: '22 fichas', col4: 'Ativo' },
      { col1: 'CAT-03', col2: 'Acompanhamentos & Risotos', col3: '18 fichas', col4: 'Ativo' },
      { col1: 'CAT-04', col2: 'Sobremesas Finas', col3: '12 fichas', col4: 'Ativo' },
      { col1: 'CAT-05', col2: 'Bebidas & Coquetelaria', col3: '9 fichas', col4: 'Ativo' }
    ]
  },
  '/ingredients': {
    path: '/ingredients',
    title: 'Ingredientes & Insumos',
    subtitle: 'Catálogo de insumos com controle de Fator de Correção (FC) e custos.',
    icon: ICONS.utensils,
    columns: ['Ingrediente', 'Marca Padrão', 'Unidade', 'Fator de Correção (FC)', 'Custo Unit.', 'Rendimento Caseiro'],
    initialItems: [
      { col1: 'Filé Mignon Limpo', col2: 'Friboi Black / Swift', col3: 'kg', col4: '1.25', col5: 'R$ 78,50', col6: '1 bife médio (180g)' },
      { col1: 'Arroz Arbóreo', col2: 'La Pastina', col3: 'kg', col4: '1.00', col5: 'R$ 24,90', col6: '1 xícara (200g)' },
      { col1: 'Queijo Parmesão Grana Padano', col2: 'Importado', col3: 'kg', col4: '1.02', col5: 'R$ 145,00', col6: '1 colher sopa (20g)' },
      { col1: 'Creme de Leite Fresco 35%', col2: 'Xandô', col3: 'litro', col4: '1.00', col5: 'R$ 32,00', col6: '1 xícara (240ml)' },
      { col1: 'Azeite de Oliva Extra Virgem', col2: 'Gallo / Andorinha', col3: 'litro', col4: '1.00', col5: 'R$ 48,00', col6: '1 colher sopa (15ml)' }
    ]
  },
  '/technical-sheets': {
    path: '/technical-sheets',
    title: 'Fichas Técnicas de Preparação',
    subtitle: 'Padronização de rendimento, modo de preparo e custos unitários.',
    icon: ICONS.fileText,
    columns: ['Código', 'Nome da Preparação', 'Categoria', 'Rendimento Total', 'Custo Calculado', 'Ações'],
    initialItems: [
      { col1: 'FT-001', col2: 'Filé Mignon ao Molho Roti', col3: 'Pratos Principais', col4: '10 porções (2,2 kg)', col5: 'R$ 184,20', col6: 'Ver Ficha' },
      { col1: 'FT-002', col2: 'Risoto de Funghi Secchi', col3: 'Acompanhamentos', col4: '15 porções (3,0 kg)', col5: 'R$ 96,50', col6: 'Ver Ficha' },
      { col1: 'FT-003', col2: 'Bruschetta Tradizionale Caprese', col3: 'Entradas', col4: '40 unidades', col5: 'R$ 62,80', col6: 'Ver Ficha' },
      { col1: 'FT-004', col2: 'Mini Quiche Lorraine', col3: 'Entradas', col4: '60 unidades', col5: 'R$ 74,00', col6: 'Ver Ficha' }
    ]
  },
  '/dishes': {
    path: '/dishes',
    title: 'Catálogo de Pratos',
    subtitle: 'Composições servidas aos convidados formadas por fichas técnicas e insumos extras.',
    icon: ICONS.utensils,
    columns: ['ID', 'Prato', 'Fichas Técnicas Associadas', 'Ingredientes Extras', 'Status'],
    initialItems: [
      { col1: 'PR-10', col2: 'Medalhão de Mignon com Risoto de Funghi', col3: 'FT-001, FT-002', col4: 'Crisp de Alho-poró (100g)', col5: 'Disponível' },
      { col1: 'PR-11', col2: 'Ilha Quente de Risotos Italianos', col3: 'FT-002, FT-005', col4: 'Parmesão em Lascas (500g)', col5: 'Disponível' },
      { col1: 'PR-12', col2: 'Trilogia de Canapés Contemporâneos', col3: 'FT-003, FT-004', col4: 'Brotos e Flores Comestíveis', col5: 'Disponível' }
    ]
  },
  '/services': {
    path: '/services',
    title: 'Serviços de Eventos',
    subtitle: 'Modelos de serviço (Welcome Drink, Coquetel, Jantar, Carrinhos ao Vivo).',
    icon: ICONS.cocktail,
    columns: ['ID', 'Tipo de Serviço', 'Duração Estimada', 'Pratos / Itens Inclusos', 'Status'],
    initialItems: [
      { col1: 'SRV-01', col2: 'Welcome Drink & Antepastos', col3: '1h00', col4: '4 opções de canapés + 2 coquetéis', col5: 'Ativo' },
      { col1: 'SRV-02', col2: 'Coquetel Volante com Finger Foods', col3: '1h30', col4: '8 opções volantes quentes e frias', col5: 'Ativo' },
      { col1: 'SRV-03', col2: 'Jantar Buffet Franco-Americano', col3: '2h00', col4: '2 carnes, 2 risotos/massas, 2 saladas', col5: 'Ativo' },
      { col1: 'SRV-04', col2: 'Carrinhos & Estações ao Vivo', col3: '3h00', col4: 'Pizzas artesanais / Hambúrguer smash', col5: 'Ativo' }
    ]
  },
  '/support-materials': {
    path: '/support-materials',
    title: 'Materiais de Apoio & Logística',
    subtitle: 'Controle de caixas secas, equipamentos térmicos, EPIs e elétrica.',
    icon: ICONS.box,
    columns: ['Código', 'Item de Apoio', 'Categoria de Material', 'Unidade', 'Estoque Total'],
    initialItems: [
      { col1: 'MAT-01', col2: 'Rechaud Retangular Inox com Cuba', col3: 'Equipamentos / Buffets', col4: 'unid', col5: '24 unid' },
      { col1: 'MAT-02', col2: 'Caixa Térmica Hot Box 100L', col3: 'Caixa Seca & Transporte', col4: 'unid', col5: '16 unid' },
      { col1: 'MAT-03', col2: 'Travessa Oval Porcelana Branca', col3: 'Louças & Prataria', col4: 'unid', col5: '40 unid' },
      { col1: 'MAT-04', col2: 'Termômetro Laser Infravermelho', col3: 'EPIs & Qualidade', col4: 'unid', col5: '6 unid' },
      { col1: 'MAT-05', col2: 'Cabo Extensor Elétrico Reforçado 20m', col3: 'Elétrica & Infra', col4: 'unid', col5: '12 unid' }
    ]
  }
};

export function createAdminCrudPage(path: string): HTMLElement {
  const content = document.createElement('div');
  content.className = 'admin-crud-view';

  const user = authController.getState().user;
  const userRole = user?.role || 'operator';
  const tenantId = user?.tenantId || 'buffet-principal';

  // Rota especial de Gestão de Usuários (/users) com restrição estrita de role
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
            <a href="/events" id="btn-restricted-back" class="btn btn-primary">Voltar para Eventos</a>
          </div>
        </div>
      `;

      content.querySelector('#btn-restricted-back')?.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/events');
      });

      return createAppShell(path, content);
    }

    // Tela de Usuários autorizada para Admin/Manager
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
              <tr>
                <td><strong>Paula Nogueira</strong></td>
                <td>paula.eventos@buffet.com</td>
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

  // Seções operacionais padrão
  const config = ADMIN_SECTIONS[path] || {
    path,
    title: 'Módulo Administrativo',
    subtitle: 'Gestão de cadastros e configurações do buffet.',
    icon: ICONS.tag,
    columns: ['ID', 'Item', 'Descrição', 'Status'],
    initialItems: []
  };

  content.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">${config.title}</h1>
        <p class="page-subtitle">${config.subtitle}</p>
      </div>
      <button type="button" class="btn btn-primary" id="btn-add-item">
        <span class="btn-icon">${ICONS.plus}</span> Novo Registro
      </button>
    </div>

    <section class="filters-card">
      <div class="search-input-wrapper">
        <span class="search-icon">${ICONS.search}</span>
        <input
          type="search"
          class="form-control search-input"
          placeholder="Filtrar nesta lista..."
          aria-label="Filtrar itens"
        />
      </div>
    </section>

    <section class="table-container-card">
      <div class="table-responsive">
        <table class="events-table">
          <thead>
            <tr>
              ${config.columns.map(col => `<th>${col}</th>`).join('')}
              <th class="th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${config.initialItems.map(item => `
              <tr>
                ${Object.values(item).map((val, idx) => `
                  <td>${idx === 0 || idx === 1 ? `<strong>${val}</strong>` : val}</td>
                `).join('')}
                <td class="td-actions">
                  <button type="button" class="btn btn-ghost btn-sm">Editar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  return createAppShell(path, content);
}
