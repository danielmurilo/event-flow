import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/firebaseApp';
import { User, ThemePreference } from '@/models/types/user.types';

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  save(user: User): Promise<void>;
  updateThemePreference(userId: string, theme: ThemePreference): Promise<void>;
}

export class FirestoreUserRepository implements IUserRepository {
  private db: Firestore;

  constructor(dbInstance?: Firestore) {
    this.db = dbInstance || getFirebaseFirestore();
  }

  async findById(userId: string): Promise<User | null> {
    const userDocRef = doc(this.db, 'users', userId);
    const snapshot = await getDoc(userDocRef);
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data();
    return {
      id: userId,
      tenantId: data.tenantId || 'default-tenant',
      email: data.email || '',
      displayName: data.displayName || '',
      photoURL: data.photoURL || null,
      themePreference: data.themePreference || 'light',
      role: data.role || 'operator',
      status: data.status || 'active',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  async save(user: User): Promise<void> {
    const userDocRef = doc(this.db, 'users', user.id);
    const now = new Date().toISOString();
    await setDoc(
      userDocRef,
      {
        tenantId: user.tenantId || 'default-tenant',
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        themePreference: user.themePreference || 'light',
        role: user.role || 'operator',
        status: user.status || 'active',
        updatedAt: now,
        ...(user.createdAt ? { createdAt: user.createdAt } : { createdAt: now })
      },
      { merge: true }
    );
  }

  async updateThemePreference(userId: string, theme: ThemePreference): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    await updateDoc(userDocRef, {
      themePreference: theme,
      updatedAt: new Date().toISOString()
    });
  }
}

export const userRepository = new FirestoreUserRepository();
