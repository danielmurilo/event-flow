import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '@/controllers/auth/AuthController';
import { User } from '@/models/types/user.types';
import { IUserRepository } from '@/models/repositories/userRepository';

describe('AuthController', () => {
  let mockAuthService: any;
  let mockUserRepo: IUserRepository;
  let mockRouter: any;
  let mockThemeController: any;
  let authController: AuthController;

  const fakeUser: User = {
    id: 'user-123',
    email: 'test@eventflow.com',
    displayName: 'Test User'
  };

  beforeEach(() => {
    mockAuthService = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      sendPasswordReset: vi.fn(),
      onAuthStateChanged: vi.fn((cb) => {
        cb(null);
        return () => {};
      }),
      getCurrentUser: vi.fn().mockReturnValue(null)
    };

    mockUserRepo = {
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      updateThemePreference: vi.fn().mockResolvedValue(undefined)
    };

    mockRouter = {
      navigate: vi.fn(),
      setAuthState: vi.fn()
    };

    mockThemeController = {
      getCurrentTheme: vi.fn().mockReturnValue('light'),
      setTheme: vi.fn()
    };

    authController = new AuthController(
      mockAuthService,
      mockUserRepo,
      mockRouter,
      mockThemeController
    );
  });

  it('deve realizar login com e-mail e senha e redirecionar para /app', async () => {
    mockAuthService.signIn.mockResolvedValue(fakeUser);

    const result = await authController.loginWithEmail('test@eventflow.com', 'password123');

    expect(result.success).toBe(true);
    expect(mockAuthService.signIn).toHaveBeenCalledWith('test@eventflow.com', 'password123');
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith('/app', true);
    expect(authController.getState().isAuthenticated).toBe(true);
    expect(authController.getState().user?.email).toBe('test@eventflow.com');
  });

  it('deve tratar credenciais inválidas com mensagem amigável', async () => {
    mockAuthService.signIn.mockRejectedValue({ code: 'auth/invalid-credential' });

    const result = await authController.loginWithEmail('wrong@eventflow.com', 'badpass');

    expect(result.success).toBe(false);
    expect(result.error).toBe('E-mail ou senha incorretos.');
    expect(mockRouter.navigate).not.toHaveBeenCalledWith('/app', true);
    expect(authController.getState().isAuthenticated).toBe(false);
  });

  it('deve cadastrar novo usuário com e-mail, senha e nome', async () => {
    mockAuthService.signUp.mockResolvedValue(fakeUser);

    const result = await authController.registerWithEmail(
      'new@eventflow.com',
      'password123',
      'Novo Usuário'
    );

    expect(result.success).toBe(true);
    expect(mockAuthService.signUp).toHaveBeenCalledWith('new@eventflow.com', 'password123');
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith('/app', true);
  });

  it('deve rejeitar cadastro com senha menor que 6 caracteres sem chamar o backend', async () => {
    const result = await authController.registerWithEmail('test@eventflow.com', '12345');

    expect(result.success).toBe(false);
    expect(result.error).toBe('A senha deve conter no mínimo 6 caracteres.');
    expect(mockAuthService.signUp).not.toHaveBeenCalled();
  });

  it('deve autenticar com Google e redirecionar para /app', async () => {
    mockAuthService.signInWithGoogle.mockResolvedValue(fakeUser);

    const result = await authController.loginWithGoogle();

    expect(result.success).toBe(true);
    expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith('/app', true);
    expect(authController.getState().isAuthenticated).toBe(true);
  });

  it('deve realizar logout com sucesso e redirecionar para /login', async () => {
    mockAuthService.signOut.mockResolvedValue(undefined);

    await authController.logout();

    expect(mockAuthService.signOut).toHaveBeenCalled();
    expect(authController.getState().isAuthenticated).toBe(false);
    expect(authController.getState().user).toBeNull();
    expect(mockRouter.setAuthState).toHaveBeenCalledWith(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith('/login', true);
  });

  it('deve enviar instruções de recuperação de senha', async () => {
    mockAuthService.sendPasswordReset.mockResolvedValue(undefined);

    const result = await authController.forgotPassword('reset@eventflow.com');

    expect(result.success).toBe(true);
    expect(mockAuthService.sendPasswordReset).toHaveBeenCalledWith('reset@eventflow.com');
  });

  it('deve notificar assinantes quando o estado de autenticação muda', async () => {
    const listener = vi.fn();
    authController.subscribe(listener);

    mockAuthService.signIn.mockResolvedValue(fakeUser);
    await authController.loginWithEmail('test@eventflow.com', 'password123');

    expect(listener).toHaveBeenCalled();
    const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
    expect(lastCall.isAuthenticated).toBe(true);
    expect(lastCall.user?.id).toBe('user-123');
  });
});
