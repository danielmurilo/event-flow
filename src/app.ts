import { router } from '@/routes/router';
import { authController } from '@/controllers/auth/AuthController';
import { createLoginPage } from '@/views/pages/LoginPage';
import { createRegisterPage } from '@/views/pages/RegisterPage';
import { createForgotPasswordPage } from '@/views/pages/ForgotPasswordPage';
import { createAppPage } from '@/views/pages/AppPage';

export class App {
  init(rootElement: HTMLElement): void {
    router.setContainer(rootElement);

    // Registra rotas públicas
    router.register({
      path: '/login',
      isProtected: false,
      redirectToIfAuthenticated: '/app',
      handler: () => createLoginPage()
    });

    router.register({
      path: '/register',
      isProtected: false,
      redirectToIfAuthenticated: '/app',
      handler: () => createRegisterPage()
    });

    router.register({
      path: '/forgot-password',
      isProtected: false,
      redirectToIfAuthenticated: '/app',
      handler: () => createForgotPasswordPage()
    });

    // Registra rota protegida
    router.register({
      path: '/app',
      isProtected: true,
      handler: () => createAppPage()
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
