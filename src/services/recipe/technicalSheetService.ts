import {
  PreparationTechnicalSheet,
  Ingredient
} from '@/models/types/recipe.types';
import { ITechnicalSheetRepository } from '@/models/repositories/technicalSheetRepository';

export interface SheetCalculationResult {
  total_gross_weight: number;
  total_net_weight: number;
  total_yield_cost: number;
  cost_per_serving: number;
}

/**
 * Calcula o Fator de Correção (FC = PB / PL).
 * Caso PL ou PB sejam 0 ou inválidos, retorna 1.0.
 */
export function calculateCorrectionFactor(grossWeight: number, netWeight: number): number {
  if (grossWeight > 0 && netWeight > 0) {
    return Number((grossWeight / netWeight).toFixed(2));
  }
  return 1.0;
}

/**
 * Calcula o custo de um item componente da ficha técnica.
 */
export function calculateItemCost(
  grossWeight: number,
  unitCost: number
): number {
  if (grossWeight <= 0 || unitCost <= 0) return 0;
  return Number((grossWeight * unitCost).toFixed(2));
}

/**
 * Prevenção de Ciclos (Recursão Infinita):
 * Uma ficha técnica de Pré-preparo não pode incluir a si mesma nem criar uma dependência cíclica (A usa B, que usa A).
 */
export function hasCycle(
  targetSheetId: string,
  candidateSubproductId: string,
  allSheets: PreparationTechnicalSheet[]
): boolean {
  if (!targetSheetId || !candidateSubproductId) return false;
  if (targetSheetId === candidateSubproductId) return true;

  const visited = new Set<string>();
  const queue: string[] = [candidateSubproductId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === targetSheetId) {
      return true;
    }
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentSheet = allSheets.find(s => s.id === currentId);
    if (currentSheet && currentSheet.ingredients) {
      for (const item of currentSheet.ingredients) {
        const itemAny = item as any;
        const isSub = itemAny.source_type === 'subproduct';
        const subId = itemAny.source_id || itemAny.ingredient_id;
        if (isSub && subId && !visited.has(subId)) {
          queue.push(subId);
        }
      }
    }
  }

  return false;
}

/**
 * Retorna os pré-preparos disponíveis para seleção na ficha técnica,
 * excluindo fichas que criariam ciclos com a ficha corrente.
 */
export function getAvailableSubproducts(
  currentSheetId: string | undefined,
  allSheets: PreparationTechnicalSheet[],
  allCategories?: { id: string; name: string; is_pre_preparation?: boolean }[]
): PreparationTechnicalSheet[] {
  return allSheets.filter(sheet => {
    // Reconhece como subproduto se tiver a flag is_pre_preparation,
    // ou se o subproduct_code estiver preenchido,
    // ou se o nome começar com "SB ",
    // ou se a categoria for de pré-preparo.
    const catIsPre = allCategories && sheet.dish_category_id
      ? allCategories.some(c => c.id === sheet.dish_category_id && (
          Boolean(c.is_pre_preparation) ||
          c.id === 'cat-pre' ||
          c.name.toLowerCase().includes('pré-preparo') ||
          c.name.toLowerCase().includes('subproduto')
        ))
      : false;

    const isPre = Boolean(
      sheet.is_pre_preparation ||
      sheet.subproduct_code ||
      sheet.name.toLowerCase().startsWith('sb ') ||
      catIsPre
    );

    if (!isPre) return false;
    if (currentSheetId && (sheet.id === currentSheetId || hasCycle(currentSheetId, sheet.id, allSheets))) {
      return false;
    }
    return true;
  });
}

/**
 * Recalcula totais e custos de uma ficha técnica.
 */
export function calculateSheetTotals(
  sheet: PreparationTechnicalSheet,
  allIngredients: Ingredient[] = [],
  allSheets: PreparationTechnicalSheet[] = []
): SheetCalculationResult {
  let totalGross = 0;
  let totalNet = 0;
  let totalCost = 0;

  if ((!sheet.ingredients || sheet.ingredients.length === 0) && sheet.total_yield_cost > 0) {
    totalCost = sheet.total_yield_cost;
    totalGross = sheet.total_gross_weight || 0;
    totalNet = sheet.total_net_weight || 0;
  } else if (sheet.ingredients) {
    for (const item of sheet.ingredients) {
      const itemAny = item as any;
      const gross = Number(itemAny.gross_weight) || 0;
      const net = Number(itemAny.net_weight) || 0;
      totalGross += gross;
      totalNet += net;

      let unitCost = Number(itemAny.unit_cost) || 0;

      // Se o custo unitário não estiver preenchido ou for subproduto dinâmico:
      if (itemAny.source_type === 'subproduct') {
        const sourceSub = allSheets.find(s => s.id === (itemAny.source_id || itemAny.ingredient_id));
        if (sourceSub) {
          unitCost = sourceSub.cost_per_serving !== undefined
            ? sourceSub.cost_per_serving
            : (sourceSub.total_yield > 0 ? sourceSub.total_yield_cost / sourceSub.total_yield : 0);
          itemAny.unit_cost = unitCost;
        }
      } else {
        const sourceIng = allIngredients.find(i => i.id === (itemAny.source_id || itemAny.ingredient_id));
        if (sourceIng && !unitCost) {
          unitCost = sourceIng.cost;
          itemAny.unit_cost = unitCost;
        }
      }

      const calculatedCost = calculateItemCost(gross, unitCost);
      itemAny.calculated_cost = calculatedCost;
      itemAny.cost = calculatedCost;
      totalCost += calculatedCost;
    }
  }

  totalCost = Number(totalCost.toFixed(2));
  const totalYield = sheet.total_yield > 0 ? sheet.total_yield : 1;
  const costPerServing = ((!sheet.ingredients || sheet.ingredients.length === 0) && sheet.cost_per_serving !== undefined && sheet.cost_per_serving > 0)
    ? sheet.cost_per_serving
    : Number((totalCost / totalYield).toFixed(2));

  return {
    total_gross_weight: Number(totalGross.toFixed(3)),
    total_net_weight: Number(totalNet.toFixed(3)),
    total_yield_cost: totalCost,
    cost_per_serving: costPerServing || 0
  };
}

/**
 * Propaga a alteração de custo de um pré-preparo para todas as fichas dependentes.
 * Retorna o array de todas as fichas técnicas atualizadas (em cascata).
 */
export function propagateSubproductCostUpdate(
  updatedPrePrepSheet: PreparationTechnicalSheet,
  allSheets: PreparationTechnicalSheet[],
  allIngredients: Ingredient[] = []
): PreparationTechnicalSheet[] {
  const updatedMap = new Map<string, PreparationTechnicalSheet>();
  updatedMap.set(updatedPrePrepSheet.id, updatedPrePrepSheet);

  const newUnitCost = updatedPrePrepSheet.cost_per_serving !== undefined
    ? updatedPrePrepSheet.cost_per_serving
    : (updatedPrePrepSheet.total_yield > 0
        ? Number((updatedPrePrepSheet.total_yield_cost / updatedPrePrepSheet.total_yield).toFixed(2))
        : 0);

  const queue = [{ id: updatedPrePrepSheet.id, newCost: newUnitCost }];

  while (queue.length > 0) {
    const { id: sourceId, newCost } = queue.shift()!;

    for (const sheet of allSheets) {
      if (sheet.id === sourceId) continue;

      let sheetModified = false;
      const currentSheet = updatedMap.get(sheet.id) || JSON.parse(JSON.stringify(sheet));

      for (const item of currentSheet.ingredients) {
        const itemAny = item as any;
        const isTarget = itemAny.source_type === 'subproduct' &&
          (itemAny.source_id === sourceId || itemAny.ingredient_id === sourceId);

        if (isTarget) {
          itemAny.unit_cost = newCost;
          itemAny.calculated_cost = calculateItemCost(itemAny.gross_weight, newCost);
          itemAny.cost = itemAny.calculated_cost;
          sheetModified = true;
        }
      }

      if (sheetModified) {
        const totals = calculateSheetTotals(currentSheet, allIngredients, Array.from(updatedMap.values()));
        currentSheet.total_gross_weight = totals.total_gross_weight;
        currentSheet.total_net_weight = totals.total_net_weight;
        currentSheet.total_yield_cost = totals.total_yield_cost;
        currentSheet.cost_per_serving = totals.cost_per_serving;

        updatedMap.set(currentSheet.id, currentSheet);

        // Se a ficha modificada for também um pré-preparo, coloca na fila para propagar adiante
        if (currentSheet.is_pre_preparation) {
          queue.push({ id: currentSheet.id, newCost: currentSheet.cost_per_serving });
        }
      }
    }
  }

  // Retorna todas as fichas modificadas exceto a original que disparou a alteração
  return Array.from(updatedMap.values()).filter(s => s.id !== updatedPrePrepSheet.id);
}

/**
 * Serviço de gerenciamento e orquestração de Fichas Técnicas
 */
export class TechnicalSheetService {
  constructor(private repo?: ITechnicalSheetRepository) {}

  /**
   * Valida e enriquece itens de ingredientes antes de salvar
   */
  prepareSheet(
    sheet: PreparationTechnicalSheet,
    allIngredients: Ingredient[],
    allSheets: PreparationTechnicalSheet[]
  ): PreparationTechnicalSheet {
    // Validação de ciclos se a ficha for um pré-preparo
    if (sheet.is_pre_preparation) {
      for (const item of sheet.ingredients) {
        const itemAny = item as any;
        const subId = itemAny.source_type === 'subproduct'
          ? (itemAny.source_id || itemAny.ingredient_id)
          : null;
        if (subId && hasCycle(sheet.id, subId, allSheets)) {
          throw new Error(`Dependência cíclica detectada: O pré-preparo "${sheet.name}" não pode conter "${itemAny.name || subId}".`);
        }
      }
    }

    const totals = calculateSheetTotals(sheet, allIngredients, allSheets);
    return {
      ...sheet,
      total_gross_weight: totals.total_gross_weight,
      total_net_weight: totals.total_net_weight,
      total_yield_cost: totals.total_yield_cost,
      cost_per_serving: totals.cost_per_serving
    };
  }

  /**
   * Salva a ficha técnica e, caso seja um pré-preparo, propaga os custos para fichas dependentes
   */
  async saveAndPropagate(
    sheet: PreparationTechnicalSheet,
    tenantId: string,
    allIngredients: Ingredient[] = []
  ): Promise<{ savedSheet: PreparationTechnicalSheet; cascadedSheets: PreparationTechnicalSheet[] }> {
    if (!this.repo) {
      throw new Error('Repositório não configurado no TechnicalSheetService.');
    }

    const allSheets = await this.repo.listByTenant(tenantId);
    const preparedSheet = this.prepareSheet(sheet, allIngredients, allSheets);

    await this.repo.save(preparedSheet);

    let cascadedSheets: PreparationTechnicalSheet[] = [];
    if (preparedSheet.is_pre_preparation) {
      cascadedSheets = propagateSubproductCostUpdate(preparedSheet, allSheets, allIngredients);
      for (const cascaded of cascadedSheets) {
        await this.repo.save(cascaded);
      }
    }

    return { savedSheet: preparedSheet, cascadedSheets };
  }
}

export const technicalSheetService = new TechnicalSheetService();
