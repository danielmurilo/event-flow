import { router } from '@/routes/router';
import { authController } from '@/controllers/auth/AuthController';
import { createLoginPage } from '@/views/pages/LoginPage';
import { createRegisterPage } from '@/views/pages/RegisterPage';
import { createForgotPasswordPage } from '@/views/pages/ForgotPasswordPage';
import { createEventsPage } from '@/views/pages/EventsPage';
import { createEventDetailsPage } from '@/views/pages/EventDetailsPage';
import { createAdminCrudPage } from '@/views/pages/AdminCrudPage';

export class App {
  init(rootElement: HTMLElement): void {
    router.setContainer(rootElement);

    // Registra rotas públicas
    router.register({
      path: '/login',
      isProtected: false,
      redirectToIfAuthenticated: '/events',
      handler: () => createLoginPage()
    });

    router.register({
      path: '/register',
      isProtected: false,
      redirectToIfAuthenticated: '/events',
      handler: () => createRegisterPage()
    });

    router.register({
      path: '/forgot-password',
      isProtected: false,
      redirectToIfAuthenticated: '/events',
      handler: () => createForgotPasswordPage()
    });

    // Rota protegida principal de Eventos
    router.register({
      path: '/events',
      isProtected: true,
      handler: () => createEventsPage()
    });

    // Alias /app mantido para compatibilidade
    router.register({
      path: '/app',
      isProtected: true,
      handler: () => createEventsPage()
    });

    // Rota dinâmica de Detalhes do Evento
    router.register({
      path: '/events/:id',
      isProtected: true,
      handler: (params) => createEventDetailsPage(params)
    });

    // Rotas de Gestão Administrativa
    router.register({
      path: '/categories',
      isProtected: true,
      handler: () => createAdminCrudPage('/categories')
    });

    router.register({
      path: '/ingredients',
      isProtected: true,
      handler: () => createAdminCrudPage('/ingredients')
    });

    router.register({
      path: '/technical-sheets',
      isProtected: true,
      handler: () => createAdminCrudPage('/technical-sheets')
    });

    router.register({
      path: '/dishes',
      isProtected: true,
      handler: () => createAdminCrudPage('/dishes')
    });

    router.register({
      path: '/services',
      isProtected: true,
      handler: () => createAdminCrudPage('/services')
    });

    router.register({
      path: '/support-materials',
      isProtected: true,
      handler: () => createAdminCrudPage('/support-materials')
    });

    router.register({
      path: '/users',
      isProtected: true,
      handler: () => createAdminCrudPage('/users')
    });

    // Inicializa listeners do AuthController
    authController.init();

    // Reatividade do AuthController sincronizada com o Router
    authController.subscribe((state) => {
      router.setAuthState(state.isAuthenticated);
    });

    // Inicializa o roteador no caminho atual
    router.init();
  }
}

export const app = new App();
