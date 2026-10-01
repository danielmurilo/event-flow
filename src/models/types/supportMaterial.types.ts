export interface SupportMaterialCategory {
  id: string;
  tenantId: string;
  name: string; // Ex: Caixa Seca, Limpeza, EPIs, Equipamentos/Elétrica
}

export interface SupportMaterial {
  id: string;
  tenantId: string;
  name: string;
  measurement_unity: string; // Ex: unid, kit, rolo, pacote
  support_materials_category_id: string;
}
