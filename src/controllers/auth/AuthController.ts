import { FirebaseAuthService, authService as defaultAuthService } from '@/services/firebase/authService';
import { IUserRepository, userRepository as defaultUserRepository } from '@/models/repositories/userRepository';
import { translateAuthError } from '@/services/error/authErrorTranslator';
import { User, AuthState } from '@/models/types/user.types';
import { router as defaultRouter, Router } from '@/routes/router';
import { themeController as defaultThemeController, ThemeController } from '@/controllers/theme/ThemeController';

export class AuthController {
  private authService: FirebaseAuthService;
  private userRepository: IUserRepository;
  private router: Router;
  private themeController: ThemeController;
  
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };

  private listeners: Array<(state: AuthState) => void> = [];

  constructor(
    authSvc?: FirebaseAuthService,
    userRepo?: IUserRepository,
    routerInstance?: Router,
    themeCtrl?: ThemeController
  ) {
    this.authService = authSvc || defaultAuthService;
    this.userRepository = userRepo || defaultUserRepository;
    this.router = routerInstance || defaultRouter;
    this.themeController = themeCtrl || defaultThemeController;
  }

  init(): () => void {
    const unsubscribe = this.authService.onAuthStateChanged(async (user) => {
      await this.handleUserSession(user);
    });
    return unsubscribe;
  }

  async handleUserSession(user: User | null): Promise<void> {
    if (user) {
      try {
        // Sincroniza dados com o Firestore Repository
        const existing = await this.userRepository.findById(user.id);
        const currentTheme = this.themeController.getCurrentTheme();
        
        const userToSave: User = {
          ...user,
          displayName: user.displayName || existing?.displayName || null,
          themePreference: existing?.themePreference || currentTheme,
          createdAt: existing?.createdAt
        };

        await this.userRepository.save(userToSave);

        if (existing?.themePreference) {
          this.themeController.setTheme(existing.themePreference, true);
        }

        this.updateState({
          user: userToSave,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (err) {
        console.error('Erro ao sincronizar perfil no Firestore:', err);
        this.updateState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      }
    } else {
      this.updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }

    this.router.setAuthState(this.state.isAuthenticated);
  }

  getState(): AuthState {
    return { ...this.state };
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private updateState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState };
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Por favor, preencha todos os campos.' };
    }

    try {
      this.updateState({ isLoading: true });
      const user = await this.authService.signIn(email, password);
      await this.handleUserSession(user);
      this.router.navigate('/app', true);
      return { success: true };
    } catch (err) {
      const errorMsg = translateAuthError(err);
      this.updateState({ isLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  async registerWithEmail(
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Por favor, preencha todos os campos.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    try {
      this.updateState({ isLoading: true });
      const user = await this.authService.signUp(email, password);
      user.displayName = displayName || null;
      await this.handleUserSession(user);
      this.router.navigate('/app', true);
      return { success: true };
    } catch (err) {
      const errorMsg = translateAuthError(err);
      this.updateState({ isLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true });
      const user = await this.authService.signInWithGoogle();
      await this.handleUserSession(user);
      this.router.navigate('/app', true);
      return { success: true };
    } catch (err) {
      const errorMsg = translateAuthError(err);
      this.updateState({ isLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  async logout(): Promise<void> {
    try {
      this.updateState({ isLoading: true });
      await this.authService.signOut();
      this.updateState({ user: null, isAuthenticated: false, isLoading: false });
      this.router.setAuthState(false);
      this.router.navigate('/login', true);
    } catch (err) {
      console.error('Erro no logout:', err);
      this.updateState({ isLoading: false });
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!email) {
      return { success: false, error: 'Por favor, informe seu e-mail cadastrado.' };
    }

    try {
      await this.authService.sendPasswordReset(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: translateAuthError(err) };
    }
  }
}

export const authController = new AuthController();
