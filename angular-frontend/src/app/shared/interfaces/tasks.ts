export type Estado = 'pendiente' | 'en progreso' | 'completada';
export type EstadoApi = 'pendiente' | 'en_progreso' | 'completada';

export interface TaskApi {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: EstadoApi;
  fechaLimite?: string | null;
  fechaCreacion?: string | null;
}

export interface Task {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
  fechaLimite?: string | null;
  fechaCreacion?: string | null;
}

export interface TaskPayload {
  titulo: string;
  descripcion?: string | null;
  estado?: Estado;
  fechaLimite?: string | null;
}

export interface TaskFilters {
  estado?: Estado;
  q?: string;
}