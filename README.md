# Event Flow

> Plataforma moderna para gestão e fluxo de eventos. Esta documentação estabelece a fundação arquitetural, técnica e os padrões de desenvolvimento para a fase inicial (MVP).

---

## 📋 Sumário

- [1. Visão Geral e Objetivo](#1-visão-geral-e-objetivo)
- [2. Stack Tecnológica](#2-stack-tecnológica)
- [3. Arquitetura do Sistema](#3-arquitetura-do-sistema)
- [4. Estrutura de Diretórios](#4-estrutura-de-diretórios)
- [5. Autenticação e Segurança](#5-autenticação-e-segurança)
- [6. Banco de Dados (Firestore) e Camada de Repositório](#6-banco-de-dados-firestore-e-camada-de-repositório)
- [7. Design System, Material Design 3 e Temas](#7-design-system-material-design-3-e-temas)
- [8. Rotas e Estados da Aplicação](#8-rotas-e-estados-da-aplicação)
- [9. Tratamento Amigável de Erros](#9-tratamento-amigável-de-erros)
- [10. Metodologia TDD e Estratégia de Testes](#10-metodologia-tdd-e-estratégia-de-testes)
- [11. Configuração de Ambiente e Firebase](#11-configuração-de-ambiente-e-firebase)
- [12. Scripts do Projeto](#12-scripts-do-projeto)
- [13. Hosting e Deploy](#13-hosting-e-deploy)
- [14. Roteiro Incremental de Desenvolvimento](#14-roteiro-incremental-de-desenvolvimento)
- [15. Princípios de Clean Code e Qualidade](#15-princípios-de-clean-code-e-qualidade)

---

## 1. Visão Geral e Objetivo

O **Event Flow** é concebido como uma aplicação web moderna voltada para a gestão ágil de eventos. A primeira fase foca estritamente em estabelecer uma **fundação técnica sólida, limpa, testável e escalável (MVP)**, evitando complexidades prematuras e abstrações desnecessárias.

### Escopo do MVP Inicial

1. **Página pública de login**: Acesso seguro e intuitivo.
2. **Autenticação flexível**:
   - E-mail e Senha (cadastro, login, recuperação).
   - Conta Google (Google Auth Provider).
3. **Persistência de Sessão**: Gerenciada pelo Firebase Authentication SDK.
4. **Página Privada (`/app`)**: Área protegida exibindo mensagem "Hello World!", dados do usuário logado, controle de tema e botão de logout.
5. **Proteção Centralizada de Rotas**: Redirecionamento automático de usuários não autenticados.
6. **Integração com Cloud Firestore**: Persistência e leitura isoladas em camada de repositório.
7. **Suporte Nativo a Temas**: Dark Mode e Light Mode com detecção de preferência de sistema e persistência em `localStorage`.
8. **Interface Material Design 3**: Mobile-First, altamente acessível e focada em microinterações e contraste adequado.
9. **Cultura TDD**: Desenvolvimento orientado a testes (Red → Green → Refactor).

---

## 2. Stack Tecnológica

| Componente | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Linguagem** | TypeScript | Tipagem estática, segurança em tempo de compilação e manutenibilidade. |
| **Build Tool & Bundler** | Vite | Feedback instantâneo no HMR e builds otimizados para produção. |
| **Auth & Database** | Firebase SDK v10+ (Modular) | Tree-shaking nativo, modularidade e desacoplamento. |
| **Database** | Cloud Firestore | NoSQL flexível em tempo real. |
| **Estilização** | CSS Modular & Design Tokens | Zero runtime overhead, tokens CSS para Dark/Light mode e fidelidade ao MD3. |
| **Design System** | Google Material Design 3 | Ergonomia visual, acessibilidade, suporte mobile-first e tokens padronizados. |
| **Testes Unitários/Integração**| Vitest & Testing Library | Compatibilidade nativa com ESM/Vite, alta velocidade e testes voltados ao comportamento do usuário. |
| **Deploy & Hosting** | Firebase Hosting | CDN global e suporte nativo a Single Page Applications (SPA). |

---

## 3. Arquitetura do Sistema

A aplicação é estruturada como um **Monólito Modular** orientado ao padrão **MVC (Model-View-Controller)** com separação estrita de responsabilidades:

```mermaid
flowchart TD
    subgraph View ["Camada View (Interface)"]
        UI[Componentes Visuais & Páginas]
        DOM[Eventos do Usuário]
    end

    subgraph Controller ["Camada Controller (Fluxo & Casos de Uso)"]
        AC[AuthController]
        NC[NavigationController]
        TC[ThemeController]
    end

    subgraph Model ["Camada Model (Regras & Persistência)"]
        Ent[Entidades & Tipos]
        Repo[UserRepository / Data Repositories]
    end

    subgraph Services ["Camada Services (Infraestrutura)"]
        AuthSvc[FirebaseAuthService]
        FSSvc[FirestoreService]
    end

    DOM -->|Dispara Ação| Controller
    Controller -->|Atualiza Estado/UI| View
    Controller -->|Invoca Caso de Uso| Model
    Model -->|Acessa Dados| Services
    Services -->|Chamada Modular| Firebase[(Firebase Backend)]
```

### Responsabilidades por Camada

#### 1. Model
- **Entidades e Tipos**: Definições contratuais dos dados (ex: `User`, `AuthState`).
- **Repositories**: Encapsulam a leitura e gravação no Firestore. Componentes de UI **nunca** importam nem consomem o Firestore diretamente.
- **Validações de Dados**: Regras de consistência de schema e validações de input.

#### 2. View
- **Componentes e Páginas**: HTML semântico, estilização modular e renderização baseada em estados.
- **Isenção de Regra de Negócio**: Não contém lógica de autenticação nem acessa diretamente APIs do Firebase.
- **Acessibilidade e Temas**: Suporte a leitores de tela, foco de teclado visível e consumo de CSS Custom Properties.

#### 3. Controller
- **Coordenação**: Recebe eventos da View e orquestra a lógica necessária.
- **Navegação & Guards**: Aplica as regras de roteamento (ex: redirecionar para `/login` se não autenticado).
- **Tratamento de Exceções**: Converte erros técnicos em mensagens amigáveis antes de repassar à View.

#### 4. Services
- **Infraestrutura**: Configuração centralizada e instâncias isoladas do Firebase (`getAuth`, `getFirestore`).

---

## 4. Estrutura de Diretórios

```
event-flow/
├── .firebaserc                # Associação com o projeto Firebase
├── firebase.json              # Configurações do Firebase Hosting e rewrites SPA
├── firestore.rules            # Regras de segurança do Firestore
├── index.html                 # Ponto de entrada HTML
├── package.json               # Dependências e scripts
├── tsconfig.json              # Configurações do compilador TypeScript
├── vite.config.ts             # Configurações do Vite e Vitest
├── .env.example               # Modelo de variáveis de ambiente públicas
│
├── src/
│   ├── config/                # Inicialização e env vars
│   │   ├── env.ts             # Leitura tipada de variáveis de ambiente
│   │   └── firebase.ts        # Inicialização única do Firebase Modular SDK
│   │
│   ├── models/                # Camada Model
│   │   ├── entities/          # Entidades de negócio (ex: User.ts)
│   │   ├── repositories/      # Abstração de persistência (ex: UserRepository.ts)
│   │   └── types/             # Tipagens de domínio e DTOs
│   │
│   ├── controllers/           # Camada Controller
│   │   ├── auth/              # AuthController.ts
│   │   ├── navigation/        # NavigationController.ts
│   │   └── theme/             # ThemeController.ts
│   │
│   ├── services/              # Camada de Serviços / Infraestrutura
│   │   ├── firebase/          # Auth, Firestore wrappers
│   │   └── error/             # ErrorHandler & mapeamento de mensagens
│   │
│   ├── routes/                # Definição e proteção de rotas
│   │   ├── router.ts          # Roteador SPA leve
│   │   └── guards.ts          # AuthGuard para proteção de rotas
│   │
│   ├── views/                 # Camada View
│   │   ├── components/        # Componentes reutilizáveis (Button, Input, Card)
│   │   ├── layouts/           # Estruturas padrão (AuthLayout, AppLayout)
│   │   ├── pages/             # LoginPage, RegisterPage, ForgotPasswordPage, AppPage
│   │   └── styles/            # Sistema de temas, tokens MD3 e resets
│   │       ├── tokens.css     # CSS Custom Properties (cores, elevações, fontes)
│   │       ├── theme.css      # Variáveis para Light e Dark mode
│   │       └── global.css     # Estilos globais e reset
│   │
│   ├── utils/                 # Funções utilitárias puras
│   │
│   ├── tests/                 # Suíte de Testes Automatizados
│   │   ├── fixtures/          # Mocks de dados e usuários de teste
│   │   ├── unit/              # Testes unitários de Models, Controllers e Services
│   │   └── integration/       # Testes de integração de fluxos completos
│   │
│   ├── app.ts                 # Instanciação central da aplicação
│   └── main.ts                # Bootstrap de montagem no DOM
```

---

## 5. Autenticação e Segurança

### Fluxo de Autenticação

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário
    participant View as LoginPage (View)
    participant Ctrl as AuthController
    participant Svc as AuthService
    participant FB as Firebase Auth

    User->>View: Preenche credenciais e submete
    View->>Ctrl: handleEmailLogin(email, password)
    Ctrl->>View: setViewState({ loading: true })
    Ctrl->>Svc: signIn(email, password)
    Svc->>FB: signInWithEmailAndPassword(...)
    alt Sucesso
        FB-->>Svc: UserCredential
        Svc-->>Ctrl: UserEntity
        Ctrl->>Ctrl: Atualiza estado de sessão
        Ctrl->>View: setViewState({ loading: false, user })
        Ctrl->>Ctrl: navigateTo('/app')
    else Erro
        FB-->>Svc: FirebaseAuthError (ex: auth/invalid-credential)
        Svc-->>Ctrl: FormattedDomainError
        Ctrl->>View: setViewState({ loading: false, error: "E-mail ou senha inválidos." })
    end
```

### Regras de Segurança no Firestore (`firestore.rules`)

Segurança fundamentada no **Princípio do Menor Privilégio**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Nega acesso indiscriminado por padrão
    match /{document=**} {
      allow read, write: if false;
    }

    // Regra para usuários: somente o próprio usuário autenticado pode ler e escrever seus dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 6. Banco de Dados (Firestore) e Camada de Repositório

Nenhum elemento de interface gráfica interage diretamente com classes ou métodos do Firestore. A interação segue o padrão **Repository**:

```typescript
// Exemplo conceitual da interface do repositório
export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  save(user: User): Promise<void>;
  updateThemePreference(userId: string, theme: 'light' | 'dark'): Promise<void>;
}
```

Isso permite testabilidade via mocks sem necessidade de chamadas de rede durante testes unitários.

---

## 7. Design System, Material Design 3 e Temas

### Princípio Mobile-First
1. **Pequenas Telas Primeiro**: Estrutura desenvolvida prioritariamente para 320px–480px, expandindo fluidamente para tablets (768px+) e desktops (1024px+).
2. **Touch Targets**: Botões e áreas clicáveis com no mínimo 48x48px.
3. **Sem Dependência de Hover**: Estados ativos e focados totalmente acessíveis via teclado ou toque.

### Sistema Centralizado de Cores (MD3 Tokens)

```css
:root {
  /* Fontes e Tipografia */
  --font-family-base: 'Roboto', system-ui, -apple-system, sans-serif;
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;

  /* Tema Light (Padrão) */
  --md-sys-color-primary: #00639b;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #cce5ff;
  --md-sys-color-on-primary-container: #001d32;
  --md-sys-color-surface: #fdfcff;
  --md-sys-color-on-surface: #1a1c1e;
  --md-sys-color-surface-variant: #e1e2ec;
  --md-sys-color-on-surface-variant: #44474f;
  --md-sys-color-outline: #74777f;
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-background: #fdfcff;
  --md-sys-color-on-background: #1a1c1e;
}

[data-theme='dark'] {
  /* Tema Dark */
  --md-sys-color-primary: #92ccff;
  --md-sys-color-on-primary: #003353;
  --md-sys-color-primary-container: #004b76;
  --md-sys-color-on-primary-container: #cce5ff;
  --md-sys-color-surface: #1a1c1e;
  --md-sys-color-on-surface: #e2e2e6;
  --md-sys-color-surface-variant: #44474f;
  --md-sys-color-on-surface-variant: #c4c6d0;
  --md-sys-color-outline: #8e9099;
  --md-sys-color-error: #ffb4ab;
  --md-sys-color-background: #111416;
  --md-sys-color-on-background: #e2e2e6;
}
```

### Alternância de Tema
- O `ThemeController` verifica primeiro o `localStorage`.
- Caso vazio, consulta a media query `(prefers-color-scheme: dark)`.
- Aplica o atributo `data-theme="dark"` ou `data-theme="light"` na raiz `<html>` sem causar flash visual (*FOUC*).

---

## 8. Rotas e Estados da Aplicação

### Matriz de Rotas

| Rota | Tipo | Descrição |
| :--- | :--- | :--- |
| `/login` | Pública | Formulário de Login (E-mail e Google), links para cadastro e recuperação. |
| `/register` | Pública | Formulário para criação de conta com validação de senha. |
| `/forgot-password`| Pública | Solicitação de link de redefinição de senha via Firebase. |
| `/app` | **Protegida** | Dashboard MVP: Exibe "Hello World!", perfil básico, switcher de tema e botão de logout. |
| `*` | Redirecionamento | Rotas inexistentes redirecionam para `/app` (se logado) ou `/login` (se anônimo). |

### Estados Explícitos da Interface

A View sempre reflete um dos 6 estados formais:

```typescript
export type UIState = 
  | 'idle'            // Pronta para interação
  | 'loading'         // Operação assíncrona em execução (spinners / skeleton)
  | 'success'         // Sucesso confirmado
  | 'error'           // Erro amigável apresentado
  | 'authenticated'   // Usuário autenticado
  | 'unauthenticated'; // Sessão inexistente ou expirada
```

---

## 9. Tratamento Amigável de Erros

Nenhum código técnico interno do Firebase é exposto ao usuário final. Um módulo de tradução mapeia os códigos de exceção:

```typescript
// src/services/error/authErrorTranslator.ts
const ERROR_MAPPINGS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este endereço de e-mail já está cadastrado.',
  'auth/weak-password': 'A senha deve conter pelo menos 6 caracteres.',
  'auth/invalid-email': 'Por favor, informe um endereço de e-mail válido.',
  'auth/popup-closed-by-user': 'O login com Google foi cancelado antes da conclusão.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
  'default': 'Ocorreu um erro inesperado. Tente novamente em instantes.'
};

export function translateAuthError(code: string): string {
  return ERROR_MAPPINGS[code] || ERROR_MAPPINGS['default'];
}
```

---

## 10. Metodologia TDD e Estratégia de Testes

O desenvolvimento segue o ciclo **TDD rigoroso**:

```
🔴 RED (Escrever teste unitário focado que falha)
  ↓
🟢 GREEN (Implementar a menor quantidade possível de código funcional)
  ↓
🔵 REFACTOR (Limpar duplicidades, manter coesão e rodar novamente os testes)
```

### Casos de Testes Obrigatórios

```
tests/
├── unit/
│   ├── auth.service.spec.ts         # Login email/senha, Google, logout, mapeamento de erros
│   ├── auth.controller.spec.ts      # Fluxo de autenticação, estados e navegação
│   ├── user.repository.spec.ts      # Leitura e escrita mockadas do Firestore
│   ├── navigation.guard.spec.ts     # Bloqueio de rotas protegidas e redirecionamentos
│   └── theme.controller.spec.ts     # Alternância Light/Dark e persistência
│
└── integration/
    ├── login.flow.spec.ts           # Renderização do form, submissão, loading e erro
    ├── app.protected.spec.ts        # Renderização do Hello World e logout para usuário logado
    └── theme.toggle.spec.ts         # Troca de tema refletindo no DOM
```

---

## 11. Configuração de Ambiente e Firebase

O projeto conecta-se ao projeto Firebase **`eventflow-91b79`**.

### Variáveis de Ambiente (`.env.example`)

```env
VITE_FIREBASE_API_KEY=AIzaSyD6RJOTYpLLQBsjCp8DKIQIi7feR0kVJ3Q
VITE_FIREBASE_AUTH_DOMAIN=eventflow-91b79.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=eventflow-91b79
VITE_FIREBASE_STORAGE_BUCKET=eventflow-91b79.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=800510978384
VITE_FIREBASE_APP_ID=1:800510978384:web:cafeba1932dee92dfee455
VITE_FIREBASE_MEASUREMENT_ID=G-BX4T6143XN
```

### Inicialização Centralizada (`src/config/firebase.ts`)

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { env } from './env';

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 12. Scripts do Projeto

Os comandos essenciais configurados no `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ --ext .ts",
    "format": "prettier --write \"src/**/*.{ts,css,html}\""
  }
}
```

---

## 13. Hosting e Deploy

### Configuração `firebase.json` (SPA Rewrite)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### Configuração `.firebaserc`

```json
{
  "projects": {
    "default": "eventflow-91b79"
  }
}
```

---

## 14. Roteiro Incremental de Desenvolvimento

O desenvolvimento da fundação técnica é executado em 18 etapas sequenciais:

1. **Etapa 1**: Configuração inicial do projeto (TypeScript, Vite, package.json).
2. **Etapa 2**: Definição da estrutura de pastas MVC e contratos de tipos.
3. **Etapa 3**: Configuração da suíte de testes Vitest e Testing Library.
4. **Etapa 4**: Implementação do módulo `FirebaseService` isolado.
5. **Etapa 5**: Criação do serviço de autenticação (`AuthService`).
6. **Etapa 6**: Testes unitários do fluxo de autenticação via TDD.
7. **Etapa 7**: Criação da página `/login` e conexão com `AuthController`.
8. **Etapa 8**: Implementação da página `/register` (Cadastro de usuário).
9. **Etapa 9**: Implementação do Login via Google (`GoogleAuthProvider`).
10. **Etapa 10**: Implementação do `NavigationController` e `AuthGuard` de proteção de rotas.
11. **Etapa 11**: Criação da página protegida `/app` com mensagem "Hello World!" e Logout.
12. **Etapa 12**: Criação do Firestore Repository (`UserRepository`) com regras de segurança.
13. **Etapa 13**: Implementação do sistema de temas (Dark/Light Mode) e `ThemeController`.
14. **Etapa 14**: Aplicação dos tokens e componentes visuais Google Material Design 3.
15. **Etapa 15**: Configuração do Firebase Hosting e regras de rewrite SPA.
16. **Etapa 16**: Execução da suíte completa de testes (cobertura unitária e integração).
17. **Etapa 17**: Build de produção (`npm run build`) e verificação estática de tipos.
18. **Etapa 18**: Auditoria final de Clean Code, SOLID e responsividade Mobile First.

---

## 15. Princípios de Clean Code e Qualidade

- **Funções Pequenas**: Funções focadas, com até 20 linhas e responsabilidade única.
- **Arquivos Concisos**: Preferência por arquivos entre 100 e 200 linhas; módulos com alta coesão e baixo acoplamento.
- **Sem Lógica na View**: A View apenas renderiza dados e repassa eventos ao Controller.
- **Nomes Intencionais**: Variáveis e métodos com nomes descritivos em inglês (ex: `authenticateWithGoogle`, `isUserSessionValid`).
- **Verificação Contínua**: Todo avanço só é aceito após:
  `Requisito → Teste (Red) → Implementação (Green) → Refatoração → Suíte Completa`.