import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/firebaseApp';
import { DishCategory } from '@/models/types/recipe.types';

export interface ICategoryRepository {
  listByTenant(tenantId: string): Promise<DishCategory[]>;
  findById(id: string, tenantId: string): Promise<DishCategory | null>;
  save(category: DishCategory): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}

export class FirestoreCategoryRepository implements ICategoryRepository {
  private db: Firestore;

  constructor(dbInstance?: Firestore) {
    this.db = dbInstance || getFirebaseFirestore();
  }

  async listByTenant(tenantId: string): Promise<DishCategory[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório para consultar categorias.');
    }

    const colRef = collection(this.db, 'dish_categories');
    const q = query(colRef, where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);

    const categories: DishCategory[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      categories.push({
        id: docSnap.id,
        tenantId: data.tenantId,
        name: data.name || ''
      });
    });

    return categories;
  }

  async findById(id: string, tenantId: string): Promise<DishCategory | null> {
    const docRef = doc(this.db, 'dish_categories', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.tenantId !== tenantId) return null;

    return {
      id: snap.id,
      tenantId: data.tenantId,
      name: data.name || ''
    };
  }

  async save(category: DishCategory): Promise<void> {
    if (!category.tenantId) {
      throw new Error('Tenant ID é obrigatório para persistir categoria.');
    }

    const docRef = doc(this.db, 'dish_categories', category.id);
    await setDoc(docRef, {
      tenantId: category.tenantId,
      name: category.name
    }, { merge: true });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new Error('Categoria não encontrada para este tenant.');
    }

    const docRef = doc(this.db, 'dish_categories', id);
    await deleteDoc(docRef);
  }
}

export const categoryRepository = new FirestoreCategoryRepository();
