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
