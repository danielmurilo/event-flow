import { Dish } from './recipe.types';

export interface EventService {
  id: string;
  name: string; // Ex: Welcome Drink, Coquetel Volante, Jantar Buffet, Carrinhos ao Vivo
  dishes: Dish[];
}

export type EventStatus =
  | 'draft'
  | 'confirmed'
  | 'in_expedition'
  | 'in_progress'
  | 'returned'
  | 'closed';

export interface Event {
  id: string;
  tenantId: string;
  name: string;
  location: string;
  date_time_start: string; // ISO string: 2026-10-15T18:00:00.000Z
  date_time_end: string;   // ISO string: 2026-10-15T23:30:00.000Z
  guests_number: number;
  vehicle?: string;
  driver?: string;
  event_services: EventService[];
  responsible_client: string;
  responsible_employee_id: string; // Referência ao User
  notes?: string;
  status: EventStatus;
}
