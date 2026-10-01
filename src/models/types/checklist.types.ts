export interface ExpeditionDishIngredient {
  ingredient_id: string;
  name: string;
  unit: string;
  planned_qtd: number;
  expedition_qtd?: number;
  expedition_check: boolean;
  return_qtd?: number;
  return_check: boolean;
  notes?: string;
}

export interface ExpeditionSupportMaterial {
  material_id: string;
  name: string;
  category_id: string;
  unit: string;
  expedition_qtd?: number;
  expedition_check: boolean;
  return_qtd?: number;
  return_check: boolean;
  notes?: string;
}

export interface ExpeditionReturnChecklist {
  id: string;
  tenantId: string;
  event_id: string;
  event_dishes_ingredients: ExpeditionDishIngredient[];
  support_materials: ExpeditionSupportMaterial[];
}

export interface ShoppingListItem {
  ingredient_id: string;
  required_qtd: number;
  current_stock_qtd: number;
  to_buy_qtd: number;
  purchased: boolean;
}

export interface ShoppingList {
  id: string;
  tenantId: string;
  event_id: string;
  items: ShoppingListItem[];
}
