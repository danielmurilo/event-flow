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
      email: data.email || '',
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      themePreference: data.themePreference || 'light',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  async save(user: User): Promise<void> {
    const userDocRef = doc(this.db, 'users', user.id);
    const now = new Date().toISOString();
    await setDoc(
      userDocRef,
      {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        themePreference: user.themePreference || 'light',
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
