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
import { PreparationTechnicalSheet } from '@/models/types/recipe.types';

export interface ITechnicalSheetRepository {
  listByTenant(tenantId: string): Promise<PreparationTechnicalSheet[]>;
  findById(id: string, tenantId: string): Promise<PreparationTechnicalSheet | null>;
  save(sheet: PreparationTechnicalSheet): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}

export class FirestoreTechnicalSheetRepository implements ITechnicalSheetRepository {
  private db: Firestore;

  constructor(dbInstance?: Firestore) {
    this.db = dbInstance || getFirebaseFirestore();
  }

  async listByTenant(tenantId: string): Promise<PreparationTechnicalSheet[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório para consultar fichas técnicas.');
    }

    const colRef = collection(this.db, 'technical_sheets');
    const q = query(colRef, where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);

    const sheets: PreparationTechnicalSheet[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const totalYieldCost = Number(data.total_yield_cost) || 0;
      const totalYield = Number(data.total_yield) || 1;
      const costPerServing = data.cost_per_serving !== undefined
        ? Number(data.cost_per_serving) || 0
        : (totalYield > 0 ? totalYieldCost / totalYield : 0);

      sheets.push({
        id: docSnap.id,
        tenantId: data.tenantId,
        dish_category_id: data.dish_category_id || '',
        is_pre_preparation: Boolean(data.is_pre_preparation),
        subproduct_code: data.subproduct_code || '',
        name: data.name || '',
        ingredients: data.ingredients || [],
        preparation_method: data.preparation_method || [],
        total_gross_weight: Number(data.total_gross_weight) || 0,
        total_net_weight: Number(data.total_net_weight) || 0,
        total_yield: totalYield,
        total_yield_measurement_unity: data.total_yield_measurement_unity || 'porções',
        total_yield_weight: Number(data.total_yield_weight) || 0,
        total_yield_cost: totalYieldCost,
        cost_per_serving: costPerServing,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    return sheets;
  }

  async findById(id: string, tenantId: string): Promise<PreparationTechnicalSheet | null> {
    const docRef = doc(this.db, 'technical_sheets', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.tenantId !== tenantId) return null;

    const totalYieldCost = Number(data.total_yield_cost) || 0;
    const totalYield = Number(data.total_yield) || 1;
    const costPerServing = data.cost_per_serving !== undefined
      ? Number(data.cost_per_serving) || 0
      : (totalYield > 0 ? totalYieldCost / totalYield : 0);

    return {
      id: snap.id,
      tenantId: data.tenantId,
      dish_category_id: data.dish_category_id || '',
      is_pre_preparation: Boolean(data.is_pre_preparation),
      subproduct_code: data.subproduct_code || '',
      name: data.name || '',
      ingredients: data.ingredients || [],
      preparation_method: data.preparation_method || [],
      total_gross_weight: Number(data.total_gross_weight) || 0,
      total_net_weight: Number(data.total_net_weight) || 0,
      total_yield: totalYield,
      total_yield_measurement_unity: data.total_yield_measurement_unity || 'porções',
      total_yield_weight: Number(data.total_yield_weight) || 0,
      total_yield_cost: totalYieldCost,
      cost_per_serving: costPerServing,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  async save(sheet: PreparationTechnicalSheet): Promise<void> {
    if (!sheet.tenantId) {
      throw new Error('Tenant ID é obrigatório para persistir ficha técnica.');
    }

    const docRef = doc(this.db, 'technical_sheets', sheet.id);
    await setDoc(docRef, {
      tenantId: sheet.tenantId,
      dish_category_id: sheet.dish_category_id,
      is_pre_preparation: Boolean(sheet.is_pre_preparation),
      subproduct_code: sheet.subproduct_code || '',
      name: sheet.name,
      ingredients: sheet.ingredients || [],
      preparation_method: sheet.preparation_method || [],
      total_gross_weight: Number(sheet.total_gross_weight) || 0,
      total_net_weight: Number(sheet.total_net_weight) || 0,
      total_yield: Number(sheet.total_yield) || 1,
      total_yield_measurement_unity: sheet.total_yield_measurement_unity || 'porções',
      total_yield_weight: Number(sheet.total_yield_weight) || 0,
      total_yield_cost: Number(sheet.total_yield_cost) || 0,
      cost_per_serving: Number(sheet.cost_per_serving) || 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new Error('Ficha técnica não encontrada para este tenant.');
    }

    const docRef = doc(this.db, 'technical_sheets', id);
    await deleteDoc(docRef);
  }
}

export const technicalSheetRepository = new FirestoreTechnicalSheetRepository();
