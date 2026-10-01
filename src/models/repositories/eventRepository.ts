import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/firebaseApp';
import { Event, EventStatus } from '@/models/types/event.types';

export interface IEventRepository {
  listEventsByTenant(tenantId: string): Promise<Event[]>;
  findById(eventId: string, tenantId?: string): Promise<Event | null>;
  save(event: Event): Promise<void>;
  updateStatus(eventId: string, tenantId: string, status: EventStatus): Promise<void>;
  delete(eventId: string, tenantId: string): Promise<void>;
}

export class FirestoreEventRepository implements IEventRepository {
  private db: Firestore;

  constructor(dbInstance?: Firestore) {
    this.db = dbInstance || getFirebaseFirestore();
  }

  /**
   * Lista todos os eventos de um tenant específico ordenados decrescente por data de início.
   * Garante estritamente o isolamento multitenant.
   */
  async listEventsByTenant(tenantId: string): Promise<Event[]> {
    if (!tenantId) {
      throw new Error('Tenant ID é obrigatório para consultar eventos.');
    }

    const eventsRef = collection(this.db, 'events');
    const q = query(
      eventsRef,
      where('tenantId', '==', tenantId),
      orderBy('date_time_start', 'desc')
    );

    const snapshot = await getDocs(q);
    const events: Event[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      events.push({
        id: docSnap.id,
        tenantId: data.tenantId,
        name: data.name || '',
        location: data.location || '',
        date_time_start: data.date_time_start || '',
        date_time_end: data.date_time_end || '',
        guests_number: Number(data.guests_number) || 0,
        vehicle: data.vehicle,
        driver: data.driver,
        event_services: data.event_services || [],
        responsible_client: data.responsible_client || '',
        responsible_employee_id: data.responsible_employee_id || '',
        notes: data.notes,
        status: data.status || 'draft'
      });
    });

    return events;
  }

  /**
   * Busca um evento por ID validando isolamento de tenant caso fornecido.
   */
  async findById(eventId: string, tenantId?: string): Promise<Event | null> {
    const eventDocRef = doc(this.db, 'events', eventId);
    const snapshot = await getDoc(eventDocRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    // Se tenantId for informado, valida o isolamento estrito
    if (tenantId && data.tenantId !== tenantId) {
      return null;
    }

    return {
      id: snapshot.id,
      tenantId: data.tenantId,
      name: data.name || '',
      location: data.location || '',
      date_time_start: data.date_time_start || '',
      date_time_end: data.date_time_end || '',
      guests_number: Number(data.guests_number) || 0,
      vehicle: data.vehicle,
      driver: data.driver,
      event_services: data.event_services || [],
      responsible_client: data.responsible_client || '',
      responsible_employee_id: data.responsible_employee_id || '',
      notes: data.notes,
      status: data.status || 'draft'
    };
  }

  /**
   * Salva ou atualiza um evento com garantia de tenantId presente.
   */
  async save(event: Event): Promise<void> {
    if (!event.tenantId) {
      throw new Error('Tenant ID é obrigatório para persistir evento.');
    }

    const eventDocRef = doc(this.db, 'events', event.id);
    await setDoc(eventDocRef, {
      tenantId: event.tenantId,
      name: event.name,
      location: event.location,
      date_time_start: event.date_time_start,
      date_time_end: event.date_time_end,
      guests_number: event.guests_number,
      vehicle: event.vehicle || null,
      driver: event.driver || null,
      event_services: event.event_services || [],
      responsible_client: event.responsible_client,
      responsible_employee_id: event.responsible_employee_id,
      notes: event.notes || null,
      status: event.status
    }, { merge: true });
  }

  /**
   * Atualiza apenas o status de um evento com validação de tenant.
   */
  async updateStatus(eventId: string, tenantId: string, status: EventStatus): Promise<void> {
    const existing = await this.findById(eventId, tenantId);
    if (!existing) {
      throw new Error('Evento não encontrado para este tenant.');
    }

    const eventDocRef = doc(this.db, 'events', eventId);
    await updateDoc(eventDocRef, { status });
  }

  /**
   * Remove um evento assegurando o pertencimento ao mesmo tenant.
   */
  async delete(eventId: string, tenantId: string): Promise<void> {
    const existing = await this.findById(eventId, tenantId);
    if (!existing) {
      throw new Error('Evento não encontrado para este tenant.');
    }

    const eventDocRef = doc(this.db, 'events', eventId);
    await deleteDoc(eventDocRef);
  }
}

export const eventRepository = new FirestoreEventRepository();
