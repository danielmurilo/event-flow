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
import { Dish } from '@/models/types/recipe.types';

export interface IDishRepository {
  listByTenant(tenantId: string): Promise<Dish[]>;
  findById(id: string, tenantId: string): Promise<Dish | null>;
  save(dish: Dish): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}

export class FirestoreDishRepository implements IDishRepository {
  private db: Firestore;

  constructor(dbInstance?: Firestore) {
    this.db = dbInstance || getFirebaseFirestore();
  }

  async listByTenant(tenantId: string): Promise<Dish[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório para consultar pratos.');
    }

    const colRef = collection(this.db, 'dishes');
    const q = query(colRef, where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);

    const dishes: Dish[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      dishes.push({
        id: docSnap.id,
        tenantId: data.tenantId,
        name: data.name || '',
        preparation_technical_sheet_ids: data.preparation_technical_sheet_ids || [],
        extra_ingredients: data.extra_ingredients || []
      });
    });

    return dishes;
  }

  async findById(id: string, tenantId: string): Promise<Dish | null> {
    const docRef = doc(this.db, 'dishes', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.tenantId !== tenantId) return null;

    return {
      id: snap.id,
      tenantId: data.tenantId,
      name: data.name || '',
      preparation_technical_sheet_ids: data.preparation_technical_sheet_ids || [],
      extra_ingredients: data.extra_ingredients || []
    };
  }

  async save(dish: Dish): Promise<void> {
    if (!dish.tenantId) {
      throw new Error('Tenant ID é obrigatório para persistir prato.');
    }

    const docRef = doc(this.db, 'dishes', dish.id);
    await setDoc(docRef, {
      tenantId: dish.tenantId,
      name: dish.name,
      preparation_technical_sheet_ids: dish.preparation_technical_sheet_ids || [],
      extra_ingredients: dish.extra_ingredients || []
    }, { merge: true });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new Error('Prato não encontrado para este tenant.');
    }

    const docRef = doc(this.db, 'dishes', id);
    await deleteDoc(docRef);
  }
}

export const dishRepository = new FirestoreDishRepository();
