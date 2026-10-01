import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirebaseAuth } from './firebaseApp';
import { User } from '@/models/types/user.types';

export function mapFirebaseUser(user: FirebaseUser | null): User | null {
  if (!user) return null;
  const now = new Date().toISOString();
  const email = user.email || '';
  const isAdmin = email.toLowerCase() === 'danielmurilo1981@gmail.com';
  return {
    id: user.uid,
    tenantId: 'buffet-principal',
    email,
    displayName: user.displayName || email.split('@')[0] || 'Usuário',
    photoURL: user.photoURL || null,
    themePreference: 'light',
    role: isAdmin ? 'admin' : 'operator',
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

export class FirebaseAuthService {
  private auth: Auth;
  private googleProvider: GoogleAuthProvider;

  constructor(authInstance?: Auth) {
    this.auth = authInstance || getFirebaseAuth();
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.setCustomParameters({ prompt: 'select_account' });
  }

  async signUp(email: string, password: string):Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = mapFirebaseUser(cred.user);
    if (!user) throw new Error('Falha ao instanciar usuário.');
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const user = mapFirebaseUser(cred.user);
    if (!user) throw new Error('Falha ao autenticar usuário.');
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    const cred = await signInWithPopup(this.auth, this.googleProvider);
    const user = mapFirebaseUser(cred.user);
    if (!user) throw new Error('Falha ao autenticar com Google.');
    return user;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, (fbUser) => {
      callback(mapFirebaseUser(fbUser));
    });
  }

  getCurrentUser(): User | null {
    return mapFirebaseUser(this.auth.currentUser);
  }
}

export const authService = new FirebaseAuthService();
