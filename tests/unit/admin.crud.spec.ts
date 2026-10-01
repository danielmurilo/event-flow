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
              correction_factor: 1.25,
              cost: 75.0,
              total_yield_homemade_measure: '1 bife (180g)'
            })
          });
        }
      });

      const list = await repo.listByTenant('tenant-buffet');
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Filé Mignon');
      expect(list[0].correction_factor).toBe(1.25);
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
        correction_factor: 1.0,
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
          { id: 'ing-del', tenantId: 'tenant-buffet', name: 'Alho Poró', brand: '', measurement_unity: 'kg', correction_factor: 1.1, cost: 12, total_yield_homemade_measure: '' }
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
  });
});

