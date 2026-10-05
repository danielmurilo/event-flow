import { describe, it, expect } from 'vitest';
import {
  PreparationTechnicalSheet,
  Ingredient
} from '@/models/types/recipe.types';
import {
  calculateCorrectionFactor,
  calculateSheetTotals,
  hasCycle,
  getAvailableSubproducts,
  TechnicalSheetService
} from '@/services/recipe/technicalSheetService';
import { ITechnicalSheetRepository } from '@/models/repositories/technicalSheetRepository';

// Mock repository in-memory para testes de integração do serviço
class InMemoryTechnicalSheetRepository implements ITechnicalSheetRepository {
  private sheets: PreparationTechnicalSheet[] = [];

  constructor(initial: PreparationTechnicalSheet[] = []) {
    this.sheets = [...initial];
  }

  async listByTenant(tenantId: string): Promise<PreparationTechnicalSheet[]> {
    return this.sheets.filter(s => s.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<PreparationTechnicalSheet | null> {
    const found = this.sheets.find(s => s.id === id && s.tenantId === tenantId);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async save(sheet: PreparationTechnicalSheet): Promise<void> {
    const idx = this.sheets.findIndex(s => s.id === sheet.id);
    if (idx >= 0) {
      this.sheets[idx] = JSON.parse(JSON.stringify(sheet));
    } else {
      this.sheets.push(JSON.parse(JSON.stringify(sheet)));
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    this.sheets = this.sheets.filter(s => !(s.id === id && s.tenantId === tenantId));
  }
}

describe('Fichas Técnicas de Pré-preparos (Subprodutos) & Propagação', () => {
  const tenantId = 'tenant-chef-01';

  // Insumos brutos do catálogo
  const rawIngredients: Ingredient[] = [
    {
      id: 'ing-arroz',
      tenantId,
      name: 'Arroz Arbóreo',
      brand: 'Riso',
      measurement_unity: 'kg',
      cost: 18.00, // R$ 18/kg
      total_yield_homemade_measure: '1 xícara'
    },
    {
      id: 'ing-queijo',
      tenantId,
      name: 'Queijo Parmesão Ralado',
      brand: 'Faixa Azul',
      measurement_unity: 'kg',
      cost: 70.00, // R$ 70/kg
      total_yield_homemade_measure: '1 colher de sopa'
    },
    {
      id: 'ing-manteiga',
      tenantId,
      name: 'Manteiga sem sal',
      brand: 'Aviação',
      measurement_unity: 'kg',
      cost: 45.00,
      total_yield_homemade_measure: '1 colher de sopa'
    },
    {
      id: 'ing-geleia',
      tenantId,
      name: 'Geleia de Pimenta',
      brand: 'Queensberry',
      measurement_unity: 'unid',
      cost: 0.13, // R$ 0.13 por porção/unid
      total_yield_homemade_measure: '1 colher'
    }
  ];

  it('1. Deve calcular corretamente o Fator de Correção (FC = PB / PL)', () => {
    expect(calculateCorrectionFactor(1.2, 1.0)).toBe(1.2);
    expect(calculateCorrectionFactor(0.5, 0.25)).toBe(2.0);
    expect(calculateCorrectionFactor(1.0, 1.0)).toBe(1.0);
    // Caso com zeros
    expect(calculateCorrectionFactor(0, 0)).toBe(1.0);
  });

  it('2. Deve criar uma ficha de Pré-preparo (SB Arancini) com custo total R$ 4,51 e rendimento de 9 unidades (custo unitário R$ 0,50)', () => {
    // Montagem da receita do SB Arancini
    // Itens que somam R$ 4.51:
    // Arroz: 0.150 kg * 18.00 = 2.70
    // Queijo: 0.020 kg * 70.00 = 1.40
    // Manteiga: 0.00911 kg * 45.00 = 0.41
    // Total = 2.70 + 1.40 + 0.41 = 4.51
    const prePrepSheet: PreparationTechnicalSheet = {
      id: 'sheet-sb-arancini',
      tenantId,
      dish_category_id: 'cat-pre-preparo',
      is_pre_preparation: true,
      subproduct_code: 'SB Arancini',
      name: 'SB Arancini (Massa Base)',
      ingredients: [
        {
          id: 'item-1',
          source_type: 'raw_material',
          source_id: 'ing-arroz',
          name: 'Arroz Arbóreo',
          measurement_unity: 'kg',
          gross_weight: 0.150,
          net_weight: 0.150,
          correction_factor: 1.0,
          unit_cost: 18.00,
          calculated_cost: 2.70
        },
        {
          id: 'item-2',
          source_type: 'raw_material',
          source_id: 'ing-queijo',
          name: 'Queijo Parmesão Ralado',
          measurement_unity: 'kg',
          gross_weight: 0.020,
          net_weight: 0.020,
          correction_factor: 1.0,
          unit_cost: 70.00,
          calculated_cost: 1.40
        },
        {
          id: 'item-3',
          source_type: 'raw_material',
          source_id: 'ing-manteiga',
          name: 'Manteiga sem sal',
          measurement_unity: 'kg',
          gross_weight: 0.00911,
          net_weight: 0.00911,
          correction_factor: 1.0,
          unit_cost: 45.00,
          calculated_cost: 0.41
        }
      ],
      preparation_method: ['Cozinhar o arroz', 'Misturar com o queijo e manteiga', 'Modelar em 9 bolinhas'],
      total_yield: 9,
      total_yield_measurement_unity: 'unid',
      total_gross_weight: 0,
      total_net_weight: 0,
      total_yield_cost: 0,
      cost_per_serving: 0
    };

    const totals = calculateSheetTotals(prePrepSheet, rawIngredients, []);
    expect(totals.total_yield_cost).toBe(4.51);
    // Custo por porção: 4.51 / 9 = 0.5011... arredondado para 0.50
    expect(totals.cost_per_serving).toBe(0.50);
  });

  it('3. Deve criar ficha final de Entrada ("Arancini") consumindo 1 unidade de SB Arancini mais geleia de pimenta (R$ 0,13), totalizando R$ 0,63', () => {
    const prePrepSheet: PreparationTechnicalSheet = {
      id: 'sheet-sb-arancini',
      tenantId,
      dish_category_id: 'cat-pre-preparo',
      is_pre_preparation: true,
      subproduct_code: 'SB Arancini',
      name: 'SB Arancini (Massa Base)',
      ingredients: [],
      preparation_method: [],
      total_yield: 9,
      total_yield_measurement_unity: 'unid',
      total_gross_weight: 0.179,
      total_net_weight: 0.179,
      total_yield_cost: 4.51,
      cost_per_serving: 0.50
    };

    const finalDishSheet: PreparationTechnicalSheet = {
      id: 'sheet-final-arancini',
      tenantId,
      dish_category_id: 'cat-entradas',
      is_pre_preparation: false,
      name: 'Arancini com Geleia de Pimenta',
      ingredients: [
        {
          id: 'item-final-1',
          source_type: 'subproduct',
          source_id: 'sheet-sb-arancini',
          name: 'SB Arancini',
          brand_or_tag: 'Subproduto',
          measurement_unity: 'unid',
          gross_weight: 1,
          net_weight: 1,
          correction_factor: 1.0,
          unit_cost: 0.50, // Custo puxado do pré-preparo
          calculated_cost: 0.50
        },
        {
          id: 'item-final-2',
          source_type: 'raw_material',
          source_id: 'ing-geleia',
          name: 'Geleia de Pimenta',
          brand_or_tag: 'Queensberry',
          measurement_unity: 'unid',
          gross_weight: 1,
          net_weight: 1,
          correction_factor: 1.0,
          unit_cost: 0.13,
          calculated_cost: 0.13
        }
      ],
      preparation_method: ['Fritar arancini', 'Servir com a geleia'],
      total_yield: 1,
      total_yield_measurement_unity: 'porções',
      total_gross_weight: 0,
      total_net_weight: 0,
      total_yield_cost: 0,
      cost_per_serving: 0
    };

    const totals = calculateSheetTotals(finalDishSheet, rawIngredients, [prePrepSheet]);
    expect(totals.total_yield_cost).toBe(0.63);
    expect(totals.cost_per_serving).toBe(0.63);
  });

  it('4. Deve propagar a alteração de custo do pré-preparo para a ficha final automaticamente', async () => {
    // 1. Pré-preparo com custo original R$ 0.50/unid
    const prePrepSheet: PreparationTechnicalSheet = {
      id: 'sheet-sb-arancini',
      tenantId,
      dish_category_id: 'cat-pre-preparo',
      is_pre_preparation: true,
      subproduct_code: 'SB Arancini',
      name: 'SB Arancini',
      ingredients: [],
      preparation_method: [],
      total_yield: 9,
      total_yield_measurement_unity: 'unid',
      total_gross_weight: 0.179,
      total_net_weight: 0.179,
      total_yield_cost: 4.51,
      cost_per_serving: 0.50
    };

    // 2. Ficha final que consome 1 unidade de SB Arancini (0.50) + Geleia (0.13) = 0.63
    const finalDishSheet: PreparationTechnicalSheet = {
      id: 'sheet-final-arancini',
      tenantId,
      dish_category_id: 'cat-entradas',
      is_pre_preparation: false,
      name: 'Arancini com Geleia',
      ingredients: [
        {
          id: 'item-final-1',
          source_type: 'subproduct',
          source_id: 'sheet-sb-arancini',
          name: 'SB Arancini',
          measurement_unity: 'unid',
          gross_weight: 1,
          net_weight: 1,
          correction_factor: 1.0,
          unit_cost: 0.50,
          calculated_cost: 0.50
        },
        {
          id: 'item-final-2',
          source_type: 'raw_material',
          source_id: 'ing-geleia',
          name: 'Geleia de Pimenta',
          measurement_unity: 'unid',
          gross_weight: 1,
          net_weight: 1,
          correction_factor: 1.0,
          unit_cost: 0.13,
          calculated_cost: 0.13
        }
      ],
      preparation_method: [],
      total_yield: 1,
      total_yield_measurement_unity: 'porções',
      total_gross_weight: 2,
      total_net_weight: 2,
      total_yield_cost: 0.63,
      cost_per_serving: 0.63
    };

    const repo = new InMemoryTechnicalSheetRepository([prePrepSheet, finalDishSheet]);
    const service = new TechnicalSheetService(repo);

    // Agora, o custo dos insumos do SB Arancini sobe:
    // Suponhamos que o custo total suba para R$ 7,20 para 9 unidades -> R$ 0,80 por unidade
    const updatedPrePrepSheet: PreparationTechnicalSheet = {
      ...prePrepSheet,
      total_yield_cost: 7.20,
      cost_per_serving: 0.80
    };

    // Executa a persistência com propagação em cascata
    const result = await service.saveAndPropagate(updatedPrePrepSheet, tenantId, rawIngredients);

    expect(result.cascadedSheets.length).toBe(1);
    const updatedFinalSheet = result.cascadedSheets[0];
    expect(updatedFinalSheet.id).toBe('sheet-final-arancini');

    // Novo custo do item subproduto deve ser 0.80
    const subItem = updatedFinalSheet.ingredients.find(i => (i as any).source_id === 'sheet-sb-arancini');
    expect(subItem?.unit_cost).toBe(0.80);
    expect(subItem?.calculated_cost).toBe(0.80);

    // Novo custo total da ficha final: 0.80 + 0.13 = 0.93
    expect(updatedFinalSheet.total_yield_cost).toBe(0.93);
    expect(updatedFinalSheet.cost_per_serving).toBe(0.93);

    // Verifica se persistiu no repositório
    const persisted = await repo.findById('sheet-final-arancini', tenantId);
    expect(persisted?.total_yield_cost).toBe(0.93);
  });

  it('5. Prevenção de Ciclos: deve bloquear auto-referência e ciclos indiretos (A -> B -> A)', () => {
    const sheetA: PreparationTechnicalSheet = {
      id: 'sheet-A',
      tenantId,
      dish_category_id: 'cat-pre',
      is_pre_preparation: true,
      name: 'Base A',
      ingredients: [],
      preparation_method: [],
      total_yield: 1,
      total_yield_measurement_unity: 'porções',
      total_gross_weight: 1,
      total_net_weight: 1,
      total_yield_cost: 10,
      cost_per_serving: 10
    };

    const sheetB: PreparationTechnicalSheet = {
      id: 'sheet-B',
      tenantId,
      dish_category_id: 'cat-pre',
      is_pre_preparation: true,
      name: 'Base B',
      ingredients: [
        {
          id: 'item-b-1',
          source_type: 'subproduct',
          source_id: 'sheet-A',
          name: 'Base A',
          measurement_unity: 'unid',
          gross_weight: 1,
          net_weight: 1,
          correction_factor: 1,
          unit_cost: 10,
          calculated_cost: 10
        }
      ],
      preparation_method: [],
      total_yield: 1,
      total_yield_measurement_unity: 'porções',
      total_gross_weight: 1,
      total_net_weight: 1,
      total_yield_cost: 10,
      cost_per_serving: 10
    };

    const allSheets = [sheetA, sheetB];

    // 1. Auto-referência (A não pode usar A)
    expect(hasCycle('sheet-A', 'sheet-A', allSheets)).toBe(true);

    // 2. Ciclo indireto: Se B já usa A, A não pode usar B (pois criaria A -> B -> A)
    expect(hasCycle('sheet-A', 'sheet-B', allSheets)).toBe(true);

    // 3. Mas uma terceira ficha C sem dependências pode usar A
    expect(hasCycle('sheet-C', 'sheet-A', allSheets)).toBe(false);

    // 4. getAvailableSubproducts para sheetA não deve incluir sheetA nem sheetB
    const availableForA = getAvailableSubproducts('sheet-A', allSheets);
    expect(availableForA.some(s => s.id === 'sheet-A')).toBe(false);
    expect(availableForA.some(s => s.id === 'sheet-B')).toBe(false);

    // 5. Tentativa de salvar ciclo deve lançar erro no service.prepareSheet
    const service = new TechnicalSheetService();
    const sheetWithCycle: PreparationTechnicalSheet = {
      ...sheetA,
      ingredients: [
        {
          id: 'cyclic-item',
          source_type: 'subproduct',
          source_id: 'sheet-B',
          name: 'Base B',
          measurement_unity: 'unid',
          gross_weight: 1,
          net_weight: 1,
          correction_factor: 1,
          unit_cost: 10,
          calculated_cost: 10
        }
      ]
    };

    expect(() => service.prepareSheet(sheetWithCycle, rawIngredients, allSheets)).toThrow(/cíclica/i);
  });

  it('6. Deve disponibilizar subficha recém-criada (ex: Bolinho de Picanha) para novas fichas técnicas', () => {
    const categories = [
      { id: 'cat-pre', name: 'Pré-preparos & Bases de Produção', is_pre_preparation: true },
      { id: 'cat-entradas', name: 'Entradas & Finger Foods', is_pre_preparation: false }
    ];

    const bolinhoSubproduct: PreparationTechnicalSheet = {
      id: 'sheet-bolinho-picanha',
      tenantId,
      dish_category_id: 'cat-pre',
      is_pre_preparation: true,
      subproduct_code: 'SB Bolinho de Picanha',
      name: 'Bolinho de Picanha',
      ingredients: [],
      preparation_method: ['Moer picanha', 'Modelar bolinhos'],
      total_yield: 20,
      total_yield_measurement_unity: 'unid',
      total_yield_cost: 30.00,
      cost_per_serving: 1.50
    };

    const allSheets = [bolinhoSubproduct];

    // Para uma nova ficha técnica (id indefinido ou novo)
    const available = getAvailableSubproducts(undefined, allSheets, categories);
    expect(available.length).toBe(1);
    expect(available[0].name).toBe('Bolinho de Picanha');
    expect(available[0].subproduct_code).toBe('SB Bolinho de Picanha');

    // Filtro por query "bol" deve encontrar a subficha
    const q = 'bol';
    const matches = available.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.subproduct_code || '').toLowerCase().includes(q)
    );
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('sheet-bolinho-picanha');
  });
});
