export type Estado = 'pendiente' | 'en progreso' | 'completada';
export type Prioridad = 'baja' | 'media' | 'alta';

export interface Task {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
  fechaLimite?: string | null;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
  prioridad?: Prioridad;
  userId?: number;
  user?: { id: number; nombre?: string; email?: string };
}

export interface TaskPayload {
  titulo: string;
  descripcion?: string | null;
  estado?: Estado;
  fechaLimite?: string | null;
  prioridad?: Prioridad;
  userId?: number | null;
}

export interface TaskFilters {
  estado?: Estado;
  q?: string;
  prioridad?: Prioridad;
  page?: number;
  limit?: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
