import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TaskPayload } from '../../../../shared/interfaces/tasks';
import { AdminUser } from '../../../../shared/interfaces/admin-users';

@Component({
  selector: 'app-task-form-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './task-form-component.html',
})
export class TaskFormComponent implements OnInit, OnChanges {
  @Input() submitting = false;
  @Input() initialData: TaskPayload | null = null;
  @Input() submitLabel = 'Guardar';
  @Input() showCancel = false;
  @Input() compact = false;
  /** Si se pasa una lista de usuarios, el formulario muestra un select de asignación */
  @Input() users: AdminUser[] = [];

  @Output() submitted = new EventEmitter<TaskPayload>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;

  /** Fecha mínima para el date picker (hoy en formato YYYY-MM-DD) */
  get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Caracteres usados en la descripción */
  get descLength(): number {
    return this.form?.get('descripcion')?.value?.length ?? 0;
  }

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.maxLength(500)]],
      estado: ['pendiente', [Validators.required]],
      prioridad: ['media', [Validators.required]],
      fechaLimite: [null],
      userId: [null],
    });

    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.form && changes['initialData']) {
      this.patchForm();
    }
  }

  private patchForm(): void {
    this.form.reset({
      titulo: this.initialData?.titulo ?? '',
      descripcion: this.initialData?.descripcion ?? '',
      estado: this.initialData?.estado ?? 'pendiente',
      prioridad: this.initialData?.prioridad ?? 'media',
      fechaLimite: this.initialData?.fechaLimite
        ? String(this.initialData.fechaLimite).slice(0, 10)
        : null,
      userId: this.initialData?.userId ?? null,
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.submitting) {
      return;
    }

    const raw = this.form.getRawValue();

    const payload: TaskPayload = {
      titulo: raw.titulo?.trim() ?? '',
      descripcion: raw.descripcion?.trim() || '',
      estado: raw.estado,
      prioridad: raw.prioridad,
      fechaLimite: raw.fechaLimite || null,
      userId: raw.userId ? Number(raw.userId) : null,
    };

    this.submitted.emit(payload);
  }

  onCancel(): void {
    if (this.submitting) {
      return;
    }

    this.cancelled.emit();
  }
}
