import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TaskFilters } from '../../../../shared/interfaces/tasks';

@Component({
  selector: 'app-task-filters-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-filters-component.html',
})
export class TaskFiltersComponent implements OnInit {
  form!: FormGroup;

  @Output() apply = new EventEmitter<
    TaskFilters & { fechaDesde?: string | null; fechaHasta?: string | null }
  >();

  @Output() reset = new EventEmitter<void>();

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      texto: [''],
      estado: [''],
      mostrarSoloPendientes: [false],
      fechaDesde: [null],
      fechaHasta: [null],
    });
  }

  onApply(): void {
    const v = this.form.value;

    const filters: TaskFilters = {
      q: v.texto?.trim() || undefined,
      estado: v.mostrarSoloPendientes ? 'pendiente' : (v.estado || undefined),
    };

    this.apply.emit({
      ...filters,
      fechaDesde: v.fechaDesde || null,
      fechaHasta: v.fechaHasta || null,
    });
  }

  onReset(): void {
    this.form.reset({
      texto: '',
      estado: '',
      mostrarSoloPendientes: false,
      fechaDesde: null,
      fechaHasta: null,
    });

    this.reset.emit();
  }
}