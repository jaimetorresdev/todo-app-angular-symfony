# Solución · Ejercicio 03

## Componente de referencia

```ts
// src/app/modules/tasks-page-component/components/task-form-component/task-form-component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgClass } from '@angular/common';

// Tipos sencillos para no bloquear al alumno
type TaskPayload = {
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en progreso' | 'completada';
  fechaLimite: string | null;
};
type Task = TaskPayload;

@Component({
  selector: 'app-task-form-component',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './task-form-component.html',
})
export class TaskFormComponent implements OnInit {
  @Input() initialValue?: Partial<Task>;
  @Input() loading = false;
  @Output() submitted = new EventEmitter<TaskPayload>();

  form!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.maxLength(500)]],
      estado: ['pendiente', [Validators.required]],
      fechaLimite: [null], // sin validación personalizada; el input type="date" ayuda
    });

    if (this.initialValue) {
      this.form.patchValue(this.initialValue);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue() as TaskPayload);
  }
}
```

## Plantilla (extracto)

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
  <div>
    <label class="block text-sm font-medium text-gray-700">Título</label>
    <input
      type="text"
      formControlName="titulo"
      class="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
      [ngClass]="{
        'border-red-500 focus:border-red-500 focus:ring-red-500': form.get('titulo')?.invalid && form.get('titulo')?.touched
      }"
    />
    <p *ngIf="form.get('titulo')?.hasError('required') && form.get('titulo')?.touched" class="mt-1 text-sm text-red-600">
      El título es obligatorio.
    </p>
    <p *ngIf="form.get('titulo')?.hasError('minlength') && form.get('titulo')?.touched" class="mt-1 text-sm text-red-600">
      Debe tener al menos 3 caracteres.
    </p>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700">Descripción</label>
    <textarea
      formControlName="descripcion"
      rows="4"
      class="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
      [ngClass]="{
        'border-red-500 focus:border-red-500 focus:ring-red-500': form.get('descripcion')?.hasError('maxlength') && form.get('descripcion')?.touched
      }"
    ></textarea>
    <p *ngIf="form.get('descripcion')?.hasError('maxlength') && form.get('descripcion')?.touched" class="mt-1 text-sm text-red-600">
      La descripción no puede superar 500 caracteres.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>
      <label class="block text-sm font-medium text-gray-700">Estado</label>
      <select
        formControlName="estado"
        class="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="pendiente">Pendiente</option>
        <option value="en progreso">En progreso</option>
        <option value="completada">Completada</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Fecha límite</label>
      <input
        type="date"
        formControlName="fechaLimite"
        class="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>

  <button
    type="submit"
    class="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    [disabled]="loading || form.invalid"
  >
    Guardar
  </button>
</form>
```

## Puntos clave

- Las validaciones cubren longitud y estado; la fecha es opcional y confiamos en el input `type="date"`.
- `initialValue` facilita reutilizar el formulario para creación y edición; combina con `reset()` cuando quieras limpiar el formulario tras guardar.
- Al usar Reactive Forms puedes acceder al valor como objeto tipado (`TaskPayload`) y manejarlo desde componentes contenedores.
- Tailwind ayuda a destacar errores sin CSS adicional; recuerda añadir mensajes accesibles.

## Integración final en la vista de tareas

```ts
// src/app/modules/tasks-page-component/tasks-page-component.ts
import { TaskFormComponent } from './components/task-form-component/task-form-component';

@Component({
  // ...
  imports: [CommonModule, TaskFormComponent],
  // ...
})
export class TasksPageComponent {
  onTaskSubmitted(payload: any) {
    console.log('Tarea guardada', payload);
  }
}
```

```html
<!-- src/app/modules/tasks-page-component/tasks-page-component.html -->
<!-- Sustituye el botón "Crear nueva tarea" por el formulario real -->
<!-- Antes:
<button
  type="button"
  class="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white"
>
  Crear nueva tarea
</button>
-->

<!-- Después: -->
<app-task-form-component (submitted)="onTaskSubmitted($event)"></app-task-form-component>
```
