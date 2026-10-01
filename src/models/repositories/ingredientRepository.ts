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
import { Ingredient } from '@/models/types/recipe.types';

export interface IIngredientRepository {
  listByTenant(tenantId: string): Promise<Ingredient[]>;
  findById(id: string, tenantId: string): Promise<Ingredient | null>;
  save(ingredient: Ingredient): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}

export class FirestoreIngredientRepository implements IIngredientRepository {
  private db: Firestore;

  constructor(dbInstance?: Firestore) {
    this.db = dbInstance || getFirebaseFirestore();
  }

  async listByTenant(tenantId: string): Promise<Ingredient[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório para consultar ingredientes.');
    }

    const colRef = collection(this.db, 'ingredients');
    const q = query(colRef, where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);

    const ingredients: Ingredient[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      ingredients.push({
        id: docSnap.id,
        tenantId: data.tenantId,
        name: data.name || '',
        brand: data.brand || '',
        measurement_unity: data.measurement_unity || 'kg',
        correction_factor: Number(data.correction_factor) || 1.0,
        cost: Number(data.cost) || 0,
        total_yield_homemade_measure: data.total_yield_homemade_measure || ''
      });
    });

    return ingredients;
  }

  async findById(id: string, tenantId: string): Promise<Ingredient | null> {
    const docRef = doc(this.db, 'ingredients', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.tenantId !== tenantId) return null;

    return {
      id: snap.id,
      tenantId: data.tenantId,
      name: data.name || '',
      brand: data.brand || '',
      measurement_unity: data.measurement_unity || 'kg',
      correction_factor: Number(data.correction_factor) || 1.0,
      cost: Number(data.cost) || 0,
      total_yield_homemade_measure: data.total_yield_homemade_measure || ''
    };
  }

  async save(ingredient: Ingredient): Promise<void> {
    if (!ingredient.tenantId) {
      throw new Error('Tenant ID é obrigatório para persistir ingrediente.');
    }

    const docRef = doc(this.db, 'ingredients', ingredient.id);
    await setDoc(docRef, {
      tenantId: ingredient.tenantId,
      name: ingredient.name,
      brand: ingredient.brand || '',
      measurement_unity: ingredient.measurement_unity || 'kg',
      correction_factor: Number(ingredient.correction_factor) || 1.0,
      cost: Number(ingredient.cost) || 0,
      total_yield_homemade_measure: ingredient.total_yield_homemade_measure || ''
    }, { merge: true });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new Error('Ingrediente não encontrado para este tenant.');
    }

    const docRef = doc(this.db, 'ingredients', id);
    await deleteDoc(docRef);
  }
}

export const ingredientRepository = new FirestoreIngredientRepository();
