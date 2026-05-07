import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TaskFilters } from '../../../../shared/interfaces/tasks';
import { TaskApiService } from '../../../../features/tasks/data/task-api';
import { debounceTime, distinctUntilChanged, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-task-filters-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-filters-component.html',
})
export class TaskFiltersComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  suggestions: string[] = [];
  private destroy$ = new Subject<void>();

  @Output() apply = new EventEmitter<TaskFilters>();
  @Output() reset = new EventEmitter<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly taskApi: TaskApiService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      texto: [''],
      estado: [''],
      prioridad: [''],
      mostrarSoloPendientes: [false],
    });

    // Autocompletado en campo texto
    this.form.get('texto')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: string) => {
        if (value && value.length >= 2) {
          return this.taskApi.getTasks({ q: value });
        }
        this.suggestions = [];
        return [];
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const tasks = 'data' in response ? response.data : response;
        const titles = tasks.map((t) => t.titulo);
        this.suggestions = ([...new Set(titles)] as string[]).slice(0, 6);
      },
      error: () => { this.suggestions = []; }
    });

    // Filtro reactivo: emite automáticamente en cualquier cambio del formulario
    this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$)
    ).subscribe(() => this.onApply());
  }

  selectSuggestion(title: string): void {
    this.form.patchValue({ texto: title }, { emitEvent: false });
    this.suggestions = [];
    this.onApply();
  }

  // Usa mousedown en lugar de setTimeout para cerrar las sugerencias:
  // mousedown se dispara antes de que el input pierda el foco,
  // por lo que el clic en la sugerencia se registra correctamente.
  onSuggestionMousedown(event: MouseEvent): void {
    event.preventDefault();
  }

  onBlur(): void {
    this.suggestions = [];
  }

  onApply(): void {
    const v = this.form.value;
    const filters: TaskFilters = {
      q: v.texto?.trim() || undefined,
      estado: v.mostrarSoloPendientes ? 'pendiente' : (v.estado || undefined),
      prioridad: v.prioridad || undefined,
    };

    this.apply.emit(filters);
  }

  onReset(): void {
    this.form.reset({
      texto: '',
      estado: '',
      prioridad: '',
      mostrarSoloPendientes: false,
    });
    this.suggestions = [];
    this.reset.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
