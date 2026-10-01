import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirestoreEventRepository } from '@/models/repositories/eventRepository';
import { Event } from '@/models/types/event.types';

const { mockGetDocs, mockGetDoc, mockSetDoc, mockUpdateDoc, mockDeleteDoc } = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
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
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc
  };
});

describe('FirestoreEventRepository', () => {
  let mockDb: any;
  let repo: FirestoreEventRepository;

  const mockEvent: Event = {
    id: 'evt-001',
    tenantId: 'tenant-abc',
    name: 'Casamento Sofia & Pedro',
    location: 'Espaço Villa Real - Salão Nobre',
    date_time_start: '2026-11-20T19:00:00.000Z',
    date_time_end: '2026-11-21T03:00:00.000Z',
    guests_number: 180,
    vehicle: 'Furgão Mercedes Sprinter',
    driver: 'Carlos Silva',
    event_services: [],
    responsible_client: 'Sofia Vasconcelos',
    responsible_employee_id: 'user-emp-1',
    status: 'confirmed'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {};
    repo = new FirestoreEventRepository(mockDb);
  });

  describe('listEventsByTenant', () => {
    it('deve lançar erro se tenantId for vazio', async () => {
      await expect(repo.listEventsByTenant('')).rejects.toThrow(
        'Tenant ID é obrigatório para consultar eventos.'
      );
    });

    it('deve retornar lista de eventos mapeados e ordenados', async () => {
      const mockDocs = [
        {
          id: 'evt-001',
          data: () => ({
            tenantId: 'tenant-abc',
            name: 'Casamento Sofia & Pedro',
            location: 'Espaço Villa Real',
            date_time_start: '2026-11-20T19:00:00.000Z',
            date_time_end: '2026-11-21T03:00:00.000Z',
            guests_number: 180,
            status: 'confirmed',
            responsible_client: 'Sofia',
            responsible_employee_id: 'emp-1'
          })
        }
      ];

      mockGetDocs.mockResolvedValueOnce({
        forEach: (cb: (doc: any) => void) => mockDocs.forEach(cb)
      });

      const events = await repo.listEventsByTenant('tenant-abc');
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('evt-001');
      expect(events[0].tenantId).toBe('tenant-abc');
      expect(events[0].name).toBe('Casamento Sofia & Pedro');
    });
  });

  describe('findById com isolamento multitenant', () => {
    it('deve retornar null se o evento pertencer a outro tenant', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'evt-other',
        data: () => ({
          tenantId: 'different-tenant-xyz',
          name: 'Evento de Outra Empresa'
        })
      });

      const result = await repo.findById('evt-other', 'tenant-abc');
      expect(result).toBeNull();
    });

    it('deve retornar o evento se pertencer ao mesmo tenant', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'evt-001',
        data: () => ({
          tenantId: 'tenant-abc',
          name: 'Casamento Sofia & Pedro',
          location: 'Espaço Villa Real',
          date_time_start: '2026-11-20T19:00:00.000Z',
          date_time_end: '2026-11-21T03:00:00.000Z',
          guests_number: 180,
          status: 'confirmed'
        })
      });

      const result = await repo.findById('evt-001', 'tenant-abc');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('evt-001');
      expect(result?.tenantId).toBe('tenant-abc');
    });
  });

  describe('save & isolamento', () => {
    it('deve lançar erro se tentar salvar evento sem tenantId', async () => {
      const invalidEvent = { ...mockEvent, tenantId: '' };
      await expect(repo.save(invalidEvent)).rejects.toThrow(
        'Tenant ID é obrigatório para persistir evento.'
      );
    });

    it('deve salvar com sucesso quando tenantId presente', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);
      await expect(repo.save(mockEvent)).resolves.not.toThrow();
    });
  });
});
