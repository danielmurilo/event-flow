export interface DishCategory {
  id: string;
  tenantId: string;
  name: string;
  is_pre_preparation?: boolean; // Flag indicando se é categoria de Pré-preparo / Subproduto
}

export type MeasurementUnit = 'kg' | 'g' | 'l' | 'ml' | 'unid' | 'porções' | 'litros' | string;

export interface Ingredient {
  id: string;
  tenantId: string;
  name: string;
  brand: string;
  measurement_unity: MeasurementUnit;
  cost: number;
  total_yield_homemade_measure: string;
}

export type IngredientSourceType = 'raw_material' | 'subproduct';

// Item componente da Ficha Técnica (pode ser insumo de compra ou outro pré-preparo)
export interface TechnicalSheetIngredientItem {
  id?: string; // ID único da linha
  source_type?: IngredientSourceType; // 'raw_material' (insumo direto) ou 'subproduct' (pré-preparo)
  source_id?: string; // ingredient_id ou preparation_technical_sheet_id
  name?: string;
  brand_or_tag?: string; // ex: "Subproduto", marca do fornecedor ou "-"
  measurement_unity?: 'kg' | 'g' | 'l' | 'ml' | 'unid' | string;
  
  gross_weight: number;       // PB (input do usuário)
  net_weight: number;         // PL (input do usuário)
  correction_factor?: number; // PB / PL (calculado automaticamente, default 1)
  unit_cost?: number;         // Custo unitário de referência (preço de compra ou custo/rendimento do subproduto)
  calculated_cost?: number;   // gross_weight * unit_cost_normalizado
  homemade_measure?: string;  // Medida caseira (ex: "8 colheres de sopa", "1 unidade")

  // Retrocompatibilidade opcional com código e testes legados
  ingredient_id?: string;
  cost?: number;
}

export type TechnicalSheetIngredient = TechnicalSheetIngredientItem;

// Ficha Técnica de Preparação
export interface PreparationTechnicalSheet {
  id: string;
  tenantId: string;
  dish_category_id: string;
  is_pre_preparation?: boolean; // True se for Pré-preparo (pode ser usado como insumo em outras fichas)
  subproduct_code?: string;    // ex: "SB Arancini", gerado ou atribuído para identificação
  name: string;
  
  ingredients: TechnicalSheetIngredientItem[];
  preparation_method: string[];
  
  total_gross_weight?: number;
  total_net_weight?: number;
  total_yield: number;          // Rendimento total (ex: 9 und, 270g)
  total_yield_measurement_unity: 'porções' | 'kg' | 'g' | 'unid' | 'litros' | 'ml' | string;
  total_yield_weight?: number;  // Compatibilidade com peso final
  
  total_yield_cost: number;     // Custo total da receita
  cost_per_serving?: number;    // Custo unitário (total_yield_cost / total_yield)
  
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
