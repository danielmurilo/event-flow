import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirestoreCategoryRepository } from '@/models/repositories/categoryRepository';
import { FirestoreIngredientRepository } from '@/models/repositories/ingredientRepository';
import { FirestoreTechnicalSheetRepository } from '@/models/repositories/technicalSheetRepository';
import { createAdminCrudPage } from '@/views/pages/AdminCrudPage';
import { authController } from '@/controllers/auth/AuthController';

const { mockGetDocs, mockGetDoc, mockSetDoc, mockDeleteDoc } = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockDeleteDoc: vi.fn()
}));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: mockGetDocs,
    doc: vi.fn(),
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
    updateDoc: vi.fn(),
    deleteDoc: mockDeleteDoc
  };
});

describe('CRUD Administrativo - Repositórios & Formulários Firestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authController, 'getState').mockReturnValue({
      user: {
        id: 'admin-01',
        tenantId: 'tenant-buffet',
        email: 'danielmurilo1981@gmail.com',
        displayName: 'Daniel Murilo',
        photoURL: null,
        themePreference: 'light',
        role: 'admin',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      isAuthenticated: true,
      isLoading: false
    });
  });

  describe('FirestoreCategoryRepository', () => {
    let repo: FirestoreCategoryRepository;

    beforeEach(() => {
      repo = new FirestoreCategoryRepository({} as any);
    });

    it('deve listar categorias filtradas por tenantId', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: (cb: (doc: any) => void) => {
          cb({ id: 'cat-1', data: () => ({ tenantId: 'tenant-buffet', name: 'Carnes Nobres' }) });
        }
      });

      const list = await repo.listByTenant('tenant-buffet');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('cat-1');
      expect(list[0].name).toBe('Carnes Nobres');
    });

    it('deve salvar categoria com validação de tenantId', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);
      await expect(repo.save({ id: 'cat-new', tenantId: 'tenant-buffet', name: 'Sobremesas' })).resolves.not.toThrow();
    });

    it('deve lançar erro ao salvar categoria sem tenantId', async () => {
      await expect(repo.save({ id: 'cat-x', tenantId: '', name: 'Sem tenant' })).rejects.toThrow();
    });

    it('deve excluir categoria existente', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'cat-1',
        data: () => ({ tenantId: 'tenant-buffet', name: 'Carnes' })
      });
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await expect(repo.delete('cat-1', 'tenant-buffet')).resolves.not.toThrow();
    });
  });

  describe('FirestoreIngredientRepository', () => {
    let repo: FirestoreIngredientRepository;

    beforeEach(() => {
      repo = new FirestoreIngredientRepository({} as any);
    });

    it('deve listar ingredientes com conversão de FC e custos', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: (cb: (doc: any) => void) => {
          cb({
            id: 'ing-1',
            data: () => ({
              tenantId: 'tenant-buffet',
              name: 'Filé Mignon',
              brand: 'Swift',
              measurement_unity: 'kg',
              cost: 75.0,
              total_yield_homemade_measure: '1 bife (180g)'
            })
          });
        }
      });

      const list = await repo.listByTenant('tenant-buffet');
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Filé Mignon');
      expect(list[0].cost).toBe(75.0);
    });

    it('deve salvar ingrediente no Firestore', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);

      await expect(repo.save({
        id: 'ing-2',
        tenantId: 'tenant-buffet',
        name: 'Arroz Arbóreo',
        brand: 'La Pastina',
        measurement_unity: 'kg',
        cost: 25.0,
        total_yield_homemade_measure: '1 xícara'
      })).resolves.not.toThrow();
    });
  });

  describe('FirestoreTechnicalSheetRepository', () => {
    let repo: FirestoreTechnicalSheetRepository;

    beforeEach(() => {
      repo = new FirestoreTechnicalSheetRepository({} as any);
    });

    it('deve listar fichas técnicas do tenant', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: (cb: (doc: any) => void) => {
          cb({
            id: 'ft-1',
            data: () => ({
              tenantId: 'tenant-buffet',
              dish_category_id: 'cat-1',
              name: 'Risoto de Funghi',
              total_yield: 10,
              total_yield_measurement_unity: 'porções',
              total_yield_cost: 95.0
            })
          });
        }
      });

      const list = await repo.listByTenant('tenant-buffet');
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Risoto de Funghi');
      expect(list[0].total_yield).toBe(10);
    });
  });

  describe('Formulários e Modais Interativos em AdminCrudPage', () => {
    it('deve abrir modal ao clicar em "+ Novo Registro" e submeter categoria', async () => {
      const mockCatRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'cat-01', tenantId: 'tenant-buffet', name: 'Entradas' }
        ]),
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
      };

      const page = createAdminCrudPage('/categories', { category: mockCatRepo as any });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnOpen = page.querySelector<HTMLButtonElement>('#btn-open-create-modal')!;
      btnOpen.click();

      const modal = page.querySelector<HTMLElement>('#crud-modal-overlay')!;
      expect(modal.classList.contains('is-open')).toBe(true);
      expect(page.querySelector('#crud-table-body td')?.getAttribute('data-label')).toBe('Código');
      expect(page.querySelector('#crud-table-body td.td-actions')?.getAttribute('data-label')).toBe('Ações');

      const inputName = page.querySelector<HTMLInputElement>('#input-cat-name')!;
      inputName.value = 'Massa Fresca & Molhos';

      const form = page.querySelector<HTMLFormElement>('#crud-form')!;
      form.dispatchEvent(new window.Event('submit'));

      await new Promise(r => setTimeout(r, 20));

      expect(mockCatRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-buffet',
          name: 'Massa Fresca & Molhos'
        })
      );
    });

    it('deve permitir excluir ingrediente com confirmação', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const mockIngRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ing-del', tenantId: 'tenant-buffet', name: 'Alho Poró', brand: '', measurement_unity: 'kg', cost: 12, total_yield_homemade_measure: '' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn().mockResolvedValue(undefined)
      };

      const page = createAdminCrudPage('/ingredients', { ingredient: mockIngRepo as any });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnDelete = page.querySelector<HTMLButtonElement>('.btn-delete')!;
      expect(btnDelete).not.toBeNull();
      btnDelete.click();

      await new Promise(r => setTimeout(r, 20));

      expect(mockIngRepo.delete).toHaveBeenCalledWith('ing-del', 'tenant-buffet');
    });

    it('deve renderizar formulário para inserir um prato com nome e fichas técnicas', async () => {
      const mockDishRepo = {
        listByTenant: vi.fn().mockResolvedValue([]),
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
      };

      const mockTechSheetRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ft-01', tenantId: 'tenant-buffet', name: 'Medalhão Grelhado', total_yield: 10, total_yield_measurement_unity: 'porções' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const page = createAdminCrudPage('/dishes', {
        dish: mockDishRepo as any,
        techSheet: mockTechSheetRepo as any
      });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnOpen = page.querySelector<HTMLButtonElement>('#btn-open-create-modal')!;
      btnOpen.click();

      // Verifica campos do prato
      const inputDishName = page.querySelector<HTMLInputElement>('#input-dish-name')!;
      expect(inputDishName).not.toBeNull();
      inputDishName.value = 'Medalhão ao Roti';

      const checkboxSheet = page.querySelector<HTMLInputElement>('input[name="dish_sheet_id"]')!;
      expect(checkboxSheet).not.toBeNull();
      checkboxSheet.checked = true;

      const form = page.querySelector<HTMLFormElement>('#crud-form')!;
      form.dispatchEvent(new window.Event('submit'));

      await new Promise(r => setTimeout(r, 20));

      expect(mockDishRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-buffet',
          name: 'Medalhão ao Roti',
          preparation_technical_sheet_ids: ['ft-01']
        })
      );
    });

    it('deve permitir adicionar ingredientes na ficha técnica e calcular o custo total somado', async () => {
      const mockCategoryRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'cat-01', tenantId: 'tenant-buffet', name: 'Pratos Principais' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockIngredientRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ing-01', tenantId: 'tenant-buffet', name: 'Filé Mignon', measurement_unity: 'kg', cost: 80.0, total_yield_homemade_measure: '' },
          { id: 'ing-02', tenantId: 'tenant-buffet', name: 'Azeite', measurement_unity: 'l', cost: 50.0, total_yield_homemade_measure: '' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockTechSheetRepo = {
        listByTenant: vi.fn().mockResolvedValue([]),
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn()
      };

      const page = createAdminCrudPage('/technical-sheets', {
        category: mockCategoryRepo as any,
        ingredient: mockIngredientRepo as any,
        techSheet: mockTechSheetRepo as any
      });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnOpen = page.querySelector<HTMLButtonElement>('#btn-open-create-modal')!;
      btnOpen.click();

      const inputName = page.querySelector<HTMLInputElement>('#input-sheet-name')!;
      inputName.value = 'Mignon ao Roti Test';

      const selectCat = page.querySelector<HTMLSelectElement>('#select-sheet-cat')!;
      selectCat.value = 'cat-01';

      // Clica em adicionar ingrediente
      const btnAddIng = page.querySelector<HTMLButtonElement>('#btn-add-sheet-ingredient')!;
      btnAddIng.click();

      // Verifica que uma linha de ingrediente vazia foi inserida
      let rows = page.querySelectorAll('.sheet-ing-row');
      expect(rows.length).toBe(1);

      // Seleciona o primeiro ingrediente como ing-01 (Filé Mignon: FC 1.25, custo 80.0)
      const selectIng1 = rows[0].querySelector<HTMLInputElement>('.select-row-ing')!;
      selectIng1.value = 'ing-01';
      selectIng1.dispatchEvent(new window.Event('change'));
      rows = page.querySelectorAll('.sheet-ing-row');

      // Altera o peso bruto e peso líquido do primeiro ingrediente (ing-01: custo unitário 80.0)
      const inputGross = rows[0].querySelector<HTMLInputElement>('.input-row-gross')!;
      inputGross.value = '2.5';
      inputGross.dispatchEvent(new window.Event('input'));

      const inputNet = rows[0].querySelector<HTMLInputElement>('.input-row-net')!;
      inputNet.value = '2.0';
      inputNet.dispatchEvent(new window.Event('input'));

      // O peso bruto NÃO deve ser modificado ao alterar o peso líquido
      expect(inputGross.value).toBe('2.5');

      // FC calculado dinamicamente no campo dedicado da ficha técnica (2.5 / 2.0 = 1.25)
      const inputFc = rows[0].querySelector<HTMLInputElement>('.input-row-fc')!;
      expect(inputFc.value).toBe('1.25');

      // Custo esperado: 2.5 * 80.0 = 200.00
      const inputCost = page.querySelector<HTMLInputElement>('#input-sheet-cost')!;
      expect(inputCost.value).toBe('200.00');

      // Adiciona o segundo ingrediente
      btnAddIng.click();
      rows = page.querySelectorAll('.sheet-ing-row');
      expect(rows.length).toBe(2);

      // Configura o segundo ingrediente como Azeite (ing-02)
      const selectIng2 = rows[1].querySelector<HTMLSelectElement>('.select-row-ing')!;
      selectIng2.value = 'ing-02';
      selectIng2.dispatchEvent(new window.Event('change'));
      rows = page.querySelectorAll('.sheet-ing-row');

      const inputGross2 = rows[1].querySelector<HTMLInputElement>('.input-row-gross')!;
      inputGross2.value = '0.5';
      inputGross2.dispatchEvent(new window.Event('input'));

      const inputNet2 = rows[1].querySelector<HTMLInputElement>('.input-row-net')!;
      inputNet2.value = '0.5';
      inputNet2.dispatchEvent(new window.Event('input'));

      // Custo do azeite: 0.5 * 50.0 = 25.00
      // Custo total somado: 200.00 + 25.00 = 225.00
      expect(inputCost.value).toBe('225.00');

      // Submete a ficha técnica
      const form = page.querySelector<HTMLFormElement>('#crud-form')!;
      form.dispatchEvent(new window.Event('submit'));

      await new Promise(r => setTimeout(r, 20));

      expect(mockTechSheetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-buffet',
          name: 'Mignon ao Roti Test',
          dish_category_id: 'cat-01',
          ingredients: expect.arrayContaining([
            expect.objectContaining({ ingredient_id: 'ing-01', gross_weight: 2.5, cost: 200 }),
            expect.objectContaining({ ingredient_id: 'ing-02', gross_weight: 0.5, cost: 25 })
          ]),
          total_yield_cost: 225.00
        })
      );
    });

    it('deve permitir excluir ingrediente da receita e recalcular o custo total somado', async () => {
      const mockCategoryRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'cat-01', tenantId: 'tenant-buffet', name: 'Entradas' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockIngredientRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ing-01', tenantId: 'tenant-buffet', name: 'Filé Mignon', measurement_unity: 'kg', cost: 100.0, total_yield_homemade_measure: '' },
          { id: 'ing-02', tenantId: 'tenant-buffet', name: 'Azeite', measurement_unity: 'l', cost: 50.0, total_yield_homemade_measure: '' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const initialSheet = {
        id: 'ft-edit',
        tenantId: 'tenant-buffet',
        dish_category_id: 'cat-01',
        name: 'Prato Exemplo',
        total_yield: 10,
        total_yield_measurement_unity: 'porções',
        total_yield_weight: 2.0,
        total_yield_cost: 150.0,
        ingredients: [
          { ingredient_id: 'ing-01', gross_weight: 1.0, net_weight: 1.0, cost: 100.0 },
          { ingredient_id: 'ing-02', gross_weight: 1.0, net_weight: 1.0, cost: 50.0 }
        ]
      };

      const mockTechSheetRepo = {
        listByTenant: vi.fn().mockResolvedValue([initialSheet]),
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn()
      };

      const page = createAdminCrudPage('/technical-sheets', {
        category: mockCategoryRepo as any,
        ingredient: mockIngredientRepo as any,
        techSheet: mockTechSheetRepo as any
      });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnEdit = page.querySelector<HTMLButtonElement>('.btn-edit')!;
      btnEdit.click();

      let rows = page.querySelectorAll('.sheet-ing-row');
      expect(rows.length).toBe(2);

      const inputCost = page.querySelector<HTMLInputElement>('#input-sheet-cost')!;
      expect(inputCost.value).toBe('150.00');

      // Exclui o segundo ingrediente
      const btnRemoveSecond = rows[1].querySelector<HTMLButtonElement>('.btn-icon-delete-row')!;
      btnRemoveSecond.click();

      rows = page.querySelectorAll('.sheet-ing-row');
      expect(rows.length).toBe(1);
      expect(inputCost.value).toBe('100.00');

      const form = page.querySelector<HTMLFormElement>('#crud-form')!;
      form.dispatchEvent(new window.Event('submit'));

      await new Promise(r => setTimeout(r, 20));

      expect(mockTechSheetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ft-edit',
          total_yield_cost: 100.00,
          ingredients: [
            expect.objectContaining({ ingredient_id: 'ing-01', cost: 100 })
          ]
        })
      );
    });

    it('deve filtrar os itens do catálogo no combobox de busca de ingrediente', async () => {
      const mockCategoryRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'cat-01', tenantId: 'tenant-buffet', name: 'Entradas' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockIngredientRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ing-01', tenantId: 'tenant-buffet', name: 'Filé Mignon Especial', brand: 'Swift', measurement_unity: 'kg', cost: 90.0, total_yield_homemade_measure: '' },
          { id: 'ing-02', tenantId: 'tenant-buffet', name: 'Azeite Extra Virgem', brand: 'Gallo', measurement_unity: 'l', cost: 45.0, total_yield_homemade_measure: '' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockTechSheetRepo = {
        listByTenant: vi.fn().mockResolvedValue([]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const page = createAdminCrudPage('/technical-sheets', {
        category: mockCategoryRepo as any,
        ingredient: mockIngredientRepo as any,
        techSheet: mockTechSheetRepo as any
      });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnOpen = page.querySelector<HTMLButtonElement>('#btn-open-create-modal')!;
      btnOpen.click();

      const btnAddIng = page.querySelector<HTMLButtonElement>('#btn-add-sheet-ingredient')!;
      btnAddIng.click();

      const searchInput = page.querySelector<HTMLInputElement>('.input-ing-search')!;
      expect(searchInput).not.toBeNull();
      // O campo de busca deve começar completamente vazio, sem pré-carregar nenhum ingrediente
      expect(searchInput.value).toBe('');

      // Digita no input de busca para filtrar
      searchInput.value = 'Mignon';
      searchInput.dispatchEvent(new window.Event('input'));

      const dropdown = page.querySelector<HTMLElement>('.combobox-dropdown')!;
      expect(dropdown.style.display).toBe('block');

      const items = dropdown.querySelectorAll('.combobox-item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Filé Mignon Especial');

      // Clica no item filtrado
      (items[0] as HTMLElement).click();

      // Verifica que o ingrediente selecionado foi vinculado
      const hiddenInput = page.querySelector<HTMLInputElement>('.select-row-ing')!;
      expect(hiddenInput.value).toBe('ing-01');
    });

    it('deve permitir cadastrar um novo ingrediente sob demanda diretamente do modal da ficha técnica', async () => {
      const mockCategoryRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'cat-01', tenantId: 'tenant-buffet', name: 'Entradas' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockIngredientRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ing-01', tenantId: 'tenant-buffet', name: 'Filé Mignon', measurement_unity: 'kg', cost: 80.0, total_yield_homemade_measure: '' }
        ]),
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn()
      };

      const mockTechSheetRepo = {
        listByTenant: vi.fn().mockResolvedValue([]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const page = createAdminCrudPage('/technical-sheets', {
        category: mockCategoryRepo as any,
        ingredient: mockIngredientRepo as any,
        techSheet: mockTechSheetRepo as any
      });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnOpen = page.querySelector<HTMLButtonElement>('#btn-open-create-modal')!;
      btnOpen.click();

      // Abre inclusão de ingrediente
      const btnAddIng = page.querySelector<HTMLButtonElement>('#btn-add-sheet-ingredient')!;
      btnAddIng.click();

      // Clica no botão de cadastrar novo insumo a partir da linha
      const btnQuickAdd = page.querySelector<HTMLButtonElement>('.btn-combobox-quick-add')!;
      expect(btnQuickAdd).not.toBeNull();
      btnQuickAdd.click();

      const quickModal = page.querySelector<HTMLElement>('#quick-ing-modal-overlay')!;
      expect(quickModal.classList.contains('is-open')).toBe(true);

      // Preenche os dados do novo ingrediente não existente no catálogo
      const nameInp = page.querySelector<HTMLInputElement>('#quick-ing-name')!;
      nameInp.value = 'Trufas Negras Frescas';
      const brandInp = page.querySelector<HTMLInputElement>('#quick-ing-brand')!;
      brandInp.value = 'Tartufi Rossi';
      const unitSel = page.querySelector<HTMLSelectElement>('#quick-ing-unit')!;
      unitSel.value = 'kg';
      const costInp = page.querySelector<HTMLInputElement>('#quick-ing-cost')!;
      costInp.value = '450.00';

      const quickForm = page.querySelector<HTMLFormElement>('#quick-ing-form')!;
      quickForm.dispatchEvent(new window.Event('submit'));

      await new Promise(r => setTimeout(r, 20));

      // Deve ter salvo no repositório com o tenantId correto
      expect(mockIngredientRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-buffet',
          name: 'Trufas Negras Frescas',
          brand: 'Tartufi Rossi',
          cost: 450.00
        })
      );

      // O modal rápido deve ter fechado
      expect(quickModal.classList.contains('is-open')).toBe(false);

      // A linha na ficha técnica agora exibe o novo ingrediente
      const searchInp = page.querySelector<HTMLInputElement>('.input-ing-search')!;
      expect(searchInp.value).toContain('Trufas Negras Frescas');
    });

    it('deve carregar todos os ingredientes existentes ao abrir modal de editar ficha técnica', async () => {
      const mockCategoryRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'cat-02', tenantId: 'tenant-buffet', name: 'Carnes Nobres' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockIngredientRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ing-01', tenantId: 'tenant-buffet', name: 'Filé Mignon Limpo', brand: 'Swift', measurement_unity: 'kg', cost: 78.50, total_yield_homemade_measure: '' },
          { id: 'ing-05', tenantId: 'tenant-buffet', name: 'Azeite de Oliva', brand: 'Gallo', measurement_unity: 'l', cost: 48.00, total_yield_homemade_measure: '' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const existingSheet = {
        id: 'ft-001',
        tenantId: 'tenant-buffet',
        dish_category_id: 'cat-02',
        name: 'Filé Mignon ao Molho Roti',
        ingredients: [
          { ingredient_id: 'ing-01', gross_weight: 2.0, net_weight: 1.6, homemade_measure: '10 medalhões', cost: 157.00 },
          { ingredient_id: 'ing-05', gross_weight: 0.15, net_weight: 0.15, homemade_measure: '10 colheres', cost: 7.20 }
        ],
        preparation_method: ['Passo 1'],
        total_yield: 10,
        total_yield_measurement_unity: 'porções',
        total_yield_weight: 2.2,
        total_yield_cost: 164.20
      };

      const mockTechSheetRepo = {
        listByTenant: vi.fn().mockResolvedValue([existingSheet]),
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn()
      };

      const page = createAdminCrudPage('/technical-sheets', {
        category: mockCategoryRepo as any,
        ingredient: mockIngredientRepo as any,
        techSheet: mockTechSheetRepo as any
      });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      // Clica em Editar na tabela
      const btnEdit = page.querySelector<HTMLButtonElement>('.btn-edit')!;
      expect(btnEdit).not.toBeNull();
      btnEdit.click();

      const modal = page.querySelector<HTMLElement>('#crud-modal-overlay')!;
      expect(modal.classList.contains('is-open')).toBe(true);

      // Verifica que as 2 linhas de ingredientes foram trazidas para o modal
      const ingRows = page.querySelectorAll('.sheet-ing-row');
      expect(ingRows.length).toBe(2);

      // Verifica que os nomes dos ingredientes foram preenchidos nos inputs de busca
      const searchInputs = page.querySelectorAll<HTMLInputElement>('.input-ing-search');
      expect(searchInputs[0].value).toContain('Filé Mignon Limpo');
      expect(searchInputs[1].value).toContain('Azeite de Oliva');

      // Verifica pesos e custos de cada linha
      const netInputs = page.querySelectorAll<HTMLInputElement>('.input-row-net');
      expect(netInputs[0].value).toBe('1.6');
      expect(netInputs[1].value).toBe('0.15');

      const costTotalInput = page.querySelector<HTMLInputElement>('#input-sheet-cost')!;
      expect(costTotalInput.value).toBe('164.20');
    });

    it('deve exibir todos os ingredientes ao abrir o combobox de um item que já possui ingrediente selecionado', async () => {
      const mockCategoryRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'cat-02', tenantId: 'tenant-buffet', name: 'Carnes Nobres' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const mockIngredientRepo = {
        listByTenant: vi.fn().mockResolvedValue([
          { id: 'ing-01', tenantId: 'tenant-buffet', name: 'Filé Mignon Limpo', brand: 'Swift', measurement_unity: 'kg', cost: 78.50, total_yield_homemade_measure: '' },
          { id: 'ing-05', tenantId: 'tenant-buffet', name: 'Azeite de Oliva', brand: 'Gallo', measurement_unity: 'l', cost: 48.00, total_yield_homemade_measure: '' }
        ]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const existingSheet = {
        id: 'ft-001',
        tenantId: 'tenant-buffet',
        dish_category_id: 'cat-02',
        name: 'Filé Mignon ao Molho Roti',
        ingredients: [
          { ingredient_id: 'ing-01', gross_weight: 2.0, net_weight: 1.6, cost: 157.00 }
        ],
        preparation_method: [],
        total_yield: 10,
        total_yield_measurement_unity: 'porções',
        total_yield_weight: 2.0,
        total_yield_cost: 157.00
      };

      const mockTechSheetRepo = {
        listByTenant: vi.fn().mockResolvedValue([existingSheet]),
        findById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn()
      };

      const page = createAdminCrudPage('/technical-sheets', {
        category: mockCategoryRepo as any,
        ingredient: mockIngredientRepo as any,
        techSheet: mockTechSheetRepo as any
      });
      document.body.appendChild(page);

      await new Promise(r => setTimeout(r, 20));

      const btnEdit = page.querySelector<HTMLButtonElement>('.btn-edit')!;
      btnEdit.click();

      const searchInput = page.querySelector<HTMLInputElement>('.input-ing-search')!;
      expect(searchInput.value).toContain('Filé Mignon Limpo');

      // Foca no input ou clica no botão toggle
      const toggleBtn = page.querySelector<HTMLButtonElement>('.btn-combobox-toggle')!;
      toggleBtn.click();

      const dropdown = page.querySelector<HTMLElement>('.combobox-dropdown')!;
      expect(dropdown.style.display).toBe('block');

      // Deve mostrar TODOS os ingredientes para permitir troca, sem mensagem de "nenhum encontrado"
      const items = dropdown.querySelectorAll('.combobox-item');
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(dropdown.querySelector('.combobox-empty')).toBeNull();

      // O item atualmente selecionado deve estar marcado com a classe .selected
      const selectedItem = dropdown.querySelector('.combobox-item.selected')!;
      expect(selectedItem).not.toBeNull();
      expect(selectedItem.getAttribute('data-id')).toBe('ing-01');

      // Seleciona o outro ingrediente (Azeite)
      const azeiteItem = Array.from(items).find(el => el.getAttribute('data-id') === 'ing-05') as HTMLElement;
      azeiteItem.click();

      const updatedSearchInput = page.querySelector<HTMLInputElement>('.input-ing-search')!;
      expect(updatedSearchInput.value).toContain('Azeite de Oliva');
    });
  });
});


