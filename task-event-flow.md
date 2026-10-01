# Plano de Desenvolvimento — Event Flow MVP

## Status: EM ANDAMENTO
**Início**: 2026-09-30
**Abordagem**: TDD Rigoroso (Red → Green → Refactor), MVC Monólito Modular, TypeScript Puro + Vite + Material Design 3.

---

### Fase 1: Análise & Alinhamento (Concluída ✅)
- Alinhamento de arquitetura: TypeScript Nativo + Vite + MVC + Firebase Modular.
- Definição do escopo do MVP: Login (Email/Google), Register, Forgot Password, Rota Protegida `/app`, Firestore Repository, Dark/Light Mode.
- Gate Socrático validado com o usuário.

---

### Fase 2: Design Commitment & Especificação Visual (MD3)
- **Topologia**: Mobile-first centralizado em fluxo vertical com elevação progressiva Material 3, evitando o clichê "split screen" tradicional.
- **Tokens MD3**: Sistema de tokens de superfície, primária (#00639b cerulean), erro e tipografia Roboto.
- **Acessibilidade**: Contraste WCAG AA+, targets de toque mínimos de 48px, suporte a teclado e `prefers-reduced-motion`.

---

### Fase 3: Roteiro Incremental TDD (Etapas 1 a 18)

- [x] **Etapa 1: Configuração Básica do Projeto**
  - Inicializar `package.json`, `tsconfig.json`, `vite.config.ts`, `.env`, `.env.example`, `index.html`.
  - Instalar dependências (`firebase`, `vitest`, `jsdom`, `@testing-library/dom`).
- [x] **Etapa 2: Estrutura MVC e Tipos Básicos**
  - Configurar pastas: `models/`, `views/`, `controllers/`, `services/`, `config/`, `routes/`, `tests/`.
  - Criar contratos de domínio em `src/models/types/`.
- [x] **Etapa 3: Setup da Suíte de Testes (Vitest)**
  - Configurar `vitest.config.ts` com ambiente `jsdom`.
  - Criar primeiro teste de sanidade (`tests/unit/sanity.spec.ts`).
- [x] **Etapa 4: Firebase Service**
  - Implementação: `src/config/firebase.ts` e `src/services/firebase/firebaseApp.ts` com inicialização modular.
- [x] **Etapa 5 & 6: Autenticação (Service + Controller) com TDD**
  - Testes: `tests/unit/auth.controller.spec.ts`.
  - Implementação: `FirebaseAuthService` e `AuthController` com suporte a Email/Senha, Google, Logout, Mapeamento de erros amigáveis.
- [x] **Etapa 7: View de Login (`/login`)**
  - Testes: `tests/unit/views.spec.ts`.
  - Implementação: `LoginPage` com inputs de e-mail/senha, botão Entrar, Entrar com Google, links de navegação e tratamento de loading/erro.
- [x] **Etapa 8: View de Cadastro (`/register`) e Recuperação (`/forgot-password`)**
  - Testes: `tests/unit/views.spec.ts`.
  - Implementação: `RegisterPage` e `ForgotPasswordPage`.
- [x] **Etapa 9: Autenticação Google**
  - Integração do `GoogleAuthProvider` no `FirebaseAuthService` e no `AuthController`.
- [x] **Etapa 10: Roteamento & Proteção de Rotas (AuthGuard)**
  - Testes: `tests/unit/router.spec.ts`, `tests/unit/guards.spec.ts`.
  - Implementação: `Router` SPA leve com proteção centralizada contra acessos anônimos.
- [x] **Etapa 11: View da Página Protegida (`/app`)**
  - Testes: `tests/unit/views.spec.ts`.
  - Implementação: `AppPage` com saudação "Hello World!", dados do usuário logado, botão de logout e alternador de tema.
- [x] **Etapa 12: Firestore Repository (`UserRepository`)**
  - Implementação: `FirestoreUserRepository` e regras de segurança `firestore.rules`.
- [x] **Etapa 13: Sistema de Temas (Dark/Light Mode)**
  - Testes: `tests/unit/theme.controller.spec.ts`.
  - Implementação: `ThemeController` com detecção de sistema, alternância e persistência em `localStorage`.
- [x] **Etapa 14: Material Design 3 Tokens e Estilos CSS**
  - Implementação de `tokens.css`, `theme.css`, `global.css` com foco Mobile First e acessibilidade.
- [x] **Etapa 15: Configuração de Firebase Hosting**
  - Criação de `firebase.json` com rewrites SPA e `.firebaserc`.
- [x] **Etapa 16: Execução da Suíte Completa de Testes**
  - Execução de 100% dos testes unitários (30 testes aprovados com Vitest).
- [x] **Etapa 17: Build de Produção e Verificação de Tipos**
  - Execução de `npm run build` (`tsc --noEmit && vite build`) concluído com sucesso.
- [x] **Etapa 18: Auditoria Final de Clean Code e Qualidade**
  - Verificação de conformidade, responsividade e separação rigorosa de camadas.

---

### Fase 4: Camada de Domínio, Isolamento Multitenant e Telas de Gestão (Concluída ✅)
- [x] **Etapa 19: Modelagem Estrita de Domínio (`src/models/types/`)**
  - `user.types.ts`: Suporte completo a `tenantId`, `role` (`admin` | `manager` | `operator`), `status` (`active` | `inactive`), timestamps e `themePreference`.
  - `recipe.types.ts`: `DishCategory`, `Ingredient` (FC, custo, rendimento caseiro), `PreparationTechnicalSheet` e `Dish`.
  - `supportMaterial.types.ts`: `SupportMaterialCategory` e `SupportMaterial` (Caixa Seca, Limpeza, EPIs, Elétrica).
  - `event.types.ts`: `Event` e `EventService` com status operacional, logística de transporte e responsáveis.
  - `checklist.types.ts`: `ExpeditionReturnChecklist` (dupla checagem: saída x retorno) e `ShoppingList`.
  - `index.ts`: Barrel file centralizador de tipos.
- [x] **Etapa 20: Repositório Firestore & Segurança Multitenant**
  - `eventRepository.ts`: Implementação de `FirestoreEventRepository` com consulta indexada ordenada decrescente por `date_time_start` e filtro obrigatório por `tenantId`.
  - `firestore.rules`: Regras rigorosas de segurança Firestore onde leitura e escrita exigem correspondência com o `tenantId` do usuário autenticado.
- [x] **Etapa 21: Roteamento SPA com Parâmetros Dinâmicos**
  - Atualização do `Router` (`router.ts`) para suporte a rotas parametrizadas (ex: `/events/:id`), extração segura de parâmetros e guardas de acesso.
- [x] **Etapa 22: AppShell, Topbar e Menu Sanduíche Drawer**
  - `AppShell.ts`: Header global com botão sanduíche, Drawer lateral retrátil com navegação completa, card do usuário logado com tenant/role e bloqueio visual de `/users` para operadores.
- [x] **Etapa 23: Dashboard e Lista de Eventos (`EventsPage.ts`)**
  - Tabela responsiva com Data Início, Nome, Responsável, Data Fim, Status com badges coloridos e link de redirecionamento para `/events/:id`.
  - Filtros dinâmicos por status e busca textual com debounce.
- [x] **Etapa 24: Detalhes do Evento & Checklist Duplo (`EventDetailsPage.ts`)**
  - Visão geral, programação, transporte e equipe.
  - Abas: Dados Gerais, Serviços & Cardápio, Checklist de Expedição/Volta (dupla checagem interativa) e Materiais de Apoio.
- [x] **Etapa 25: Rotas Administrativas (`AdminCrudPage.ts`)**
  - Gestão de `/categories`, `/ingredients`, `/technical-sheets`, `/dishes`, `/services`, `/support-materials` e `/users` (com controle de permissão).
- [x] **Etapa 26: Testes Unitários e Validação Estrita**
  - 100% de sucesso na suíte Vitest: 50 testes passando em 9 arquivos de teste.
  - `npm run build` (`tsc --noEmit && vite build`) validado sem qualquer erro.
- [x] **Etapa 27: Formulários & Repositórios de CRUD Firestore (Categorias, Ingredientes & Fichas Técnicas)**
  - `categoryRepository.ts`: Repositório Firestore com isolamento multitenant (`listByTenant`, `findById`, `save`, `delete`).
  - `ingredientRepository.ts`: Repositório Firestore com persistência de FC (Fator de Correção), custo unitário, marca, rendimento caseiro e unidade.
  - `technicalSheetRepository.ts`: Repositório Firestore para fichas técnicas com modo de preparo, rendimento e custos.
  - `AdminCrudPage.ts`: Modais interativos com formulários completos para criar e editar registros, exclusão com confirmação e toasts de feedback em tempo real.
  - 59 testes unitários aprovados em 10 arquivos de teste no Vitest.


