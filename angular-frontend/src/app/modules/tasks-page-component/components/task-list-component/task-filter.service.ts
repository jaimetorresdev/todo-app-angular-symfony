import { Injectable } from '@angular/core';
import { Task, Prioridad } from '../../../../shared/interfaces/tasks';

export type SortBy = 'recentes' | 'fechaLimite' | 'estado' | 'titulo' | 'prioridad';
export type QuickFilter = 'todas' | 'pendiente' | 'en progreso' | 'completada' | 'vencidas';

export interface KanbanColumns {
  vencidas: Task[];
  pendiente: Task[];
  'en progreso': Task[];
  completada: Task[];
}

/**
 * Servicio de lógica pura de filtrado, ordenación y formato de tareas.
 * No tiene estado propio: recibe datos y devuelve resultados.
 */
@Injectable({ providedIn: 'root' })
export class TaskFilterService {

  isOverdue(task: Task): boolean {
    if (!task.fechaLimite || task.estado === 'completada') return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(task.fechaLimite); due.setHours(0, 0, 0, 0);
    return due < today;
  }

  isDueToday(task: Task): boolean {
    if (!task.fechaLimite || task.estado === 'completada') return false;
    return String(task.fechaLimite).slice(0, 10) === new Date().toISOString().slice(0, 10);
  }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const cleanDate = String(fecha).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return cleanDate;
    const [year, month, day] = cleanDate.split('-');
    return `${day}-${month}-${year}`;
  }

  formatEstado(estado: Task['estado']): string {
    switch (estado) {
      case 'en progreso': return 'En progreso';
      case 'completada':  return 'Completada';
      default:            return 'Pendiente';
    }
  }

  filterBySearchAndPriority(tasks: Task[], searchText: string, filterPrioridad: Prioridad | ''): Task[] {
    let filtered = [...tasks];
    const q = searchText.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(t =>
        t.titulo.toLowerCase().includes(q) ||
        (t.descripcion ?? '').toLowerCase().includes(q)
      );
    }
    if (filterPrioridad) {
      filtered = filtered.filter(t => t.prioridad === filterPrioridad);
    }
    return filtered;
  }

  sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
    const sorted = [...tasks];
    const pesos: Record<string, number> = { alta: 1, media: 2, baja: 3 };
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'titulo':      return a.titulo.localeCompare(b.titulo);
        case 'estado':      return a.estado.localeCompare(b.estado);
        case 'fechaLimite': return (a.fechaLimite || '9999-12-31').localeCompare(b.fechaLimite || '9999-12-31');
        case 'prioridad':   return (pesos[a.prioridad || 'baja'] ?? 3) - (pesos[b.prioridad || 'baja'] ?? 3);
        default:            return (b.fechaCreacion || '').localeCompare(a.fechaCreacion || '');
      }
    });
    return sorted;
  }

  /** Alta → Media → Baja, secundario: fechaLimite asc (antes vence, antes aparece) */
  private sortByPriority(tasks: Task[]): Task[] {
    const w: Record<string, number> = { alta: 1, media: 2, baja: 3 };
    return [...tasks].sort((a, b) => {
      const pw = (w[a.prioridad || 'baja'] ?? 3) - (w[b.prioridad || 'baja'] ?? 3);
      if (pw !== 0) return pw;
      return (a.fechaLimite || '9999-12-31').localeCompare(b.fechaLimite || '9999-12-31');
    });
  }

  /** Más recientemente actualizada/completada primero */
  private sortByCompletion(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const dateA = a.fechaActualizacion || a.fechaCreacion || '';
      const dateB = b.fechaActualizacion || b.fechaCreacion || '';
      return dateB.localeCompare(dateA);
    });
  }

  buildKanbanColumns(
    tasks: Task[],
    searchText: string,
    filterPrioridad: Prioridad | '',
    filterEstado: string,
    quickFilter: QuickFilter,
    sortBy: SortBy
  ): KanbanColumns {
    const base = this.filterBySearchAndPriority(tasks, searchText, filterPrioridad);

    const full: KanbanColumns = {
      vencidas:      this.sortByPriority(base.filter(t => this.isOverdue(t))),
      pendiente:     this.sortByPriority(base.filter(t => t.estado === 'pendiente'   && !this.isOverdue(t))),
      'en progreso': this.sortByPriority(base.filter(t => t.estado === 'en progreso' && !this.isOverdue(t))),
      completada:    this.sortByCompletion(base.filter(t => t.estado === 'completada')),
    };

    if (filterEstado) {
      return {
        vencidas:      filterEstado !== 'completada' ? full.vencidas : [],
        pendiente:     filterEstado === 'pendiente'   ? full.pendiente      : [],
        'en progreso': filterEstado === 'en progreso' ? full['en progreso'] : [],
        completada:    filterEstado === 'completada'  ? full.completada     : [],
      };
    }

    switch (quickFilter) {
      case 'vencidas':    return { ...full, pendiente: [], 'en progreso': [], completada: [] };
      case 'pendiente':   return { ...full, vencidas: [], 'en progreso': [], completada: [] };
      case 'en progreso': return { ...full, vencidas: [], pendiente: [],     completada: [] };
      case 'completada':  return { ...full, vencidas: [], pendiente: [],     'en progreso': [] };
      default:            return full;
    }
  }

  applyListFilter(
    tasks: Task[],
    searchText: string,
    filterPrioridad: Prioridad | '',
    filterEstado: string,
    quickFilter: QuickFilter,
    sortBy: SortBy
  ): Task[] {
    let filtered = this.filterBySearchAndPriority(tasks, searchText, filterPrioridad);

    if (filterEstado) {
      filtered = filtered.filter(t => t.estado === filterEstado);
    } else {
      switch (quickFilter) {
        case 'pendiente':   filtered = filtered.filter(t => t.estado === 'pendiente');   break;
        case 'en progreso': filtered = filtered.filter(t => t.estado === 'en progreso'); break;
        case 'completada':  filtered = filtered.filter(t => t.estado === 'completada');  break;
        case 'vencidas':    filtered = filtered.filter(t => this.isOverdue(t));          break;
      }
    }

    return this.sortTasks(filtered, sortBy);
  }

  isValidQuickFilter(v: string): v is QuickFilter {
    return ['todas', 'pendiente', 'en progreso', 'completada', 'vencidas'].includes(v);
  }

  isValidSort(v: string): v is SortBy {
    return ['recentes', 'fechaLimite', 'estado', 'titulo', 'prioridad'].includes(v);
  }
}
