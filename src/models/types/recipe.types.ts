export interface DishCategory {
  id: string;
  tenantId: string;
  name: string;
}

export type MeasurementUnit = 'kg' | 'g' | 'l' | 'ml' | 'unid' | string;

export interface Ingredient {
  id: string;
  tenantId: string;
  name: string;
  brand: string;
  measurement_unity: MeasurementUnit;
  correction_factor: number; // FC (Fator de Correção) = Peso Bruto / Peso Líquido
  cost: number;
  total_yield_homemade_measure: string;
}

export interface TechnicalSheetIngredient {
  ingredient_id: string;
  gross_weight: number;
  net_weight: number;
  homemade_measure?: string;
  cost: number;
}

export interface PreparationTechnicalSheet {
  id: string;
  tenantId: string;
  dish_category_id: string;
  name: string;
  ingredients: TechnicalSheetIngredient[];
  preparation_method: string[];
  total_yield: number;
  total_yield_measurement_unity: string;
  total_yield_weight: number;
  total_yield_cost: number;
}

export interface DishExtraIngredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
}

export interface Dish {
  id: string;
  tenantId: string;
  name: string;
  preparation_technical_sheet_ids: string[];
  extra_ingredients?: DishExtraIngredient[];
}
