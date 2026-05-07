import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Task } from '../../../../../shared/interfaces/tasks';
import { AdminUser } from '../../../../../shared/interfaces/admin-users';
import { TaskFilterService } from '../task-filter.service';

export interface KanbanColumnDef {
  key: 'vencidas' | 'pendiente' | 'en progreso' | 'completada';
  label: string;
  isDropTarget: boolean;
  colors: {
    accent: string;
    iconBg: string;
    icon: string;
    label: string;
    badge: string;
    dropRing: string;
    headerBg: string;
  };
  iconPath: string;
  emptyText: string;
  emptyIsGood: boolean;
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-amber-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-pink-500',
];

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './kanban-column.component.html',
})
export class KanbanColumnComponent {
  @Input() def!: KanbanColumnDef;
  @Input() tasks: Task[] = [];
  @Input() isActiveDropTarget = false;
  @Input() isDimmed = false;
  @Input() draggingTaskId: number | null = null;
  @Input() updatingTaskId: number | null = null;
  @Input() deletingTaskId: number | null = null;
  @Input() users: AdminUser[] = [];
  /** ID de la tarea en edición inline (gestionado por el padre) */
  @Input() editingTaskId: number | null = null;
  /** FormGroup de edición compartido desde el padre */
  @Input() editForm!: FormGroup;
  @Input() savingEdit = false;

  @Output() editTask    = new EventEmitter<Task>();
  @Output() deleteTask  = new EventEmitter<Task>();
  @Output() submitEdit  = new EventEmitter<number>();
  @Output() cancelEdit  = new EventEmitter<void>();
  @Output() dragStart   = new EventEmitter<{ event: DragEvent; task: Task }>();
  @Output() dragEnd     = new EventEmitter<void>();
  @Output() dragOver    = new EventEmitter<DragEvent>();
  @Output() dragLeave   = new EventEmitter<DragEvent>();
  @Output() drop        = new EventEmitter<DragEvent>();

  constructor(public readonly filter: TaskFilterService) {}

  get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  getUserLabel(userId: number | null | undefined): string {
    if (!userId) return '';
    const u = this.users.find(u => u.id === userId);
    return u ? (u.nombre || u.email || '') : '';
  }

  getUserInitials(userId: number | null | undefined): string {
    const label = this.getUserLabel(userId);
    if (!label) return '?';
    const parts = label.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : label.slice(0, 2).toUpperCase();
  }

  getAvatarColor(userId: number | null | undefined): string {
    if (!userId) return 'bg-slate-400';
    return AVATAR_COLORS[userId % AVATAR_COLORS.length];
  }

  getRelativeDate(fecha: string | null | undefined): { text: string; urgency: 'overdue' | 'today' | 'soon' | 'normal' } {
    if (!fecha) return { text: '', urgency: 'normal' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due   = new Date(String(fecha).slice(0, 10)); due.setHours(0, 0, 0, 0);
    const diff  = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    if (diff < 0)  return { text: diff === -1 ? 'Ayer' : `Hace ${-diff}d`, urgency: 'overdue' };
    if (diff === 0) return { text: 'Hoy',    urgency: 'today' };
    if (diff === 1) return { text: 'Mañana', urgency: 'soon' };
    if (diff <= 7)  return { text: `En ${diff}d`, urgency: 'soon' };
    return { text: this.filter.formatFecha(fecha), urgency: 'normal' };
  }
}
